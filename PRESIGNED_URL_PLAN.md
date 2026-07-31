# Presigned Upload URLs — Implementation Plan

**Status:** draft, pending review
**Target version:** 2.10.0
**Scope:** upload only (presigned download deliberately out of scope)

---

## 1. Motivation

The driving use case is Klaro's MCP server (`sia`). Its `add-card-attachment` tool
currently declares `base64Content` as a *tool argument*
(`sia/src/modules/mcp/tools/cards/add-card-attachment.ts`), which means the entire
file has to travel **through the LLM's context** as base64 before `SeshatClient.upload()`
re-wraps it in a `multipart/form-data` POST.

That is the problem being solved. It is expensive in tokens, bounded by the context
window, and in practice the model does not hold the bytes at all — the *user* does.

The two flows we are serving:

| Flow | Who holds the bytes | Who performs the `PUT` |
|---|---|---|
| **A** | User's machine, via a chat/web UI | The browser |
| **B** | MCP host's filesystem (e.g. Claude Code) | The agent, via `curl -T` |

In both, the party holding the bytes can make an HTTP request but must not be given
long-lived bucket credentials. A short-lived, tightly-bound presigned `PUT` URL is
exactly the right primitive.

### What this feature is not

A presigned URL means **the bytes never reach the Seshat process**. That is its entire
value, and it is also its entire cost: Seshat cannot inspect, scan, compress or resize
what it never sees. Any design that streams the bytes through Seshat's transformers on
their way to a presigned URL is just `AbstractBucket.put()` with a slower write path —
it saves nothing. This is a definitional trade-off, not an implementation detail, and
§4 is how we bound it.

---

## 2. Decisions

| # | Decision | Rationale |
|---|---|---|
| D1 | Exposed as a Seshat **action** (`seshat-action: presign-upload`) | Reuses `ExecuteActions`; no collision with `MultipartUpload`'s `POST /*`; opt-in per deployment |
| D2 | **Name-only transformers run at presign time; content transformers refuse** | Klaro's attachment bucket uses `SecureRename` only — see §4 |
| D3 | **Signed `PUT` URL** (not POST policy) | One URL, trivial for `curl -T` and browser `fetch()`; exact `Content-Length` binding |
| D4 | **No confirmation step** — the caller `HEAD`s the object afterwards | Smallest surface; consequences documented in §8 |
| D5 | **`LocalBucket` throws** `PresignNotSupportedError` | No meaningful signing authority for a filesystem |
| D6 | S3 and GCS only | The two backends with native V4 signing |

---

## 3. Public API

### 3.1 Types (`src/types.ts`)

```ts
export type PresignedUploadRequest = {
  /** Object name, relative to the bucket (and to its static prefix, if any). */
  name: string
  contentType: string
  /** Required. Bound into the signature — see §7. */
  contentLength: number
  /** Seconds. Defaults and clamped per §7.1. */
  expiresIn?: number
  /** Extra ObjectMeta entries, stored as backend custom metadata. */
  metadata?: Record<string, string>
}

export type PresignedUpload = {
  /** The signed URL. Treat as a bearer credential. */
  url: string
  method: 'PUT'
  /**
   * Headers the client MUST send, verbatim and complete.
   * These are part of the signature; omitting or altering any one
   * of them makes the backend reject the upload.
   */
  headers: Record<string, string>
  /** Final Seshat object name, AFTER name transformers (e.g. SecureRename). */
  name: string
  expiresAt: Date
}
```

### 3.2 `Bucket` interface

```ts
export interface Bucket extends BucketEmitter {
  // ...existing...
  presignUpload(request: PresignedUploadRequest): Promise<PresignedUpload>;
}
```

> **Compatibility note.** Adding a required member to `Bucket` is a breaking change for
> anyone implementing the interface *directly* rather than extending `AbstractBucket`.
> All in-tree buckets extend `AbstractBucket`, which supplies a working implementation,
> so nothing in this repo or in Klaro breaks. Flag it in `CHANGELOG.md` under 2.10.0.
> The alternative — declaring it optional (`presignUpload?`) — pushes `?.` onto every
> call site and weakens the contract; not recommended.

### 3.3 Name-only transformers

To distinguish "this transformer only rewrites metadata" from "this transformer rewrites
bytes", add an optional companion method. **Presence of the method is the declaration** —
no separate boolean flag to keep in sync.

```ts
export interface ObjectMetaTransformer {
  transformMeta(meta: ObjectMeta, mode: ObjectTransformerMode): Promise<ObjectMeta>;
}

export const isMetaTransformer =
  (t: ObjectTransformer): t is ObjectTransformer & ObjectMetaTransformer =>
    typeof (t as any).transformMeta === 'function';
```

This is **additive and backward compatible**: an existing third-party transformer without
`transformMeta` is simply treated as content-touching, and presigning refuses. That is the
safe default.

`SecureRename` (`src/transformers/secure-rename.ts`) is refactored so its existing
name logic moves into `transformMeta`, and `transform` delegates:

```ts
async transformMeta(meta: ObjectMeta, mode: ObjectTransformerMode): Promise<ObjectMeta> {
  // ...the current body of transform(), minus the stream...
}

async transform(stream: Readable, meta: ObjectMeta, mode: ObjectTransformerMode) {
  return { stream, meta: await this.transformMeta(meta, mode) };
}
```

Behaviour through `put()` is unchanged. `ClamavTransformer`, `CompressorTransformer` and
`SharpTransformer` gain no `transformMeta` and therefore block presigning — correctly.

---

## 4. `AbstractBucket.presignUpload`

```
presignUpload(request)
  ├── 1. build initial ObjectMeta from the request
  ├── 2. ensurePolicies(policy => policy.put(meta))      ← same hook, same order as put()
  ├── 3. transformMetaOnly(meta, 'Ingress')              ← name transformers, or throw
  └── 4. this._presignUpload(meta, expiresIn)            ← backend-specific
```

**Step 2** runs policies against the *pre-rename* meta, exactly as `put()` does today
(`src/abstract-bucket.ts:41-47` runs policies before transformers). Klaro's
`FileExtensionRestriction` therefore sees the user's original filename and extension, and
behaves identically for presigned and multipart uploads. Keeping the order consistent
matters more than any argument for the alternative.

**Step 3**, new private method:

```ts
private async transformMetaOnly(meta: ObjectMeta, mode: ObjectTransformerMode) {
  return this.transformers
    .filter(t => [mode, 'Duplex'].includes(t.type))
    .reduce(async (p, t) => {
      const current = await p;
      if (!isMetaTransformer(t)) {
        throw new PresignNotSupportedError(
          `Cannot presign uploads on a bucket configured with the content transformer ` +
          `'${t.constructor.name}': the bytes never reach Seshat, so it cannot run.`);
      }
      return t.transformMeta(current, mode);
    }, Promise.resolve(meta));
}
```

**Step 4**, default implementation on `AbstractBucket` (non-abstract, so `LocalBucket`
inherits the refusal and needs no code of its own):

```ts
protected async _presignUpload(_meta: ObjectMeta, _expiresIn: number): Promise<PresignedUpload> {
  throw new PresignNotSupportedError(
    `${this.constructor.name} does not support presigned uploads`);
}
```

### Why this rule fits Klaro

`klaro/seshat/src/routers/classic.ts` configures the attachment bucket as:

```ts
policies:     [new FileExtensionRestriction(FORBIDDEN_EXTENSIONS, FORBIDDEN_MIME_TYPES)]
transformers: [new SecureRename()]
```

The extension policy is metadata-based and is fully enforced at presign time. `SecureRename`
is a name transformer. The thumbnailer lives on a *different* router. So Klaro's attachment
bucket presigns cleanly with no loss of any guarantee it currently has.

**`SecureRename` detail that must not be missed:** it is a `Duplex` transformer that stashes
the user-facing filename in an `originalname` metadata entry, and restores it on Egress.
If the presigned `PUT` does not carry `originalname` as backend custom metadata, every
subsequent download of that object comes back with the wrong filename. Hence `originalname`
must be emitted in `PresignedUpload.headers` **and bound into the signature** so the client
cannot drop or alter it.

---

## 5. Backend implementations

### 5.1 S3 (`src/s3/bucket.ts`)

New dependency: **`@aws-sdk/s3-request-presigner`**, version-matched to the already-present
`@aws-sdk/client-s3`.

> The `chore/deps-upgrade-2026-07` branch has `@aws-sdk/client-s3` at 3.1100.0 installed
> while `package.json` still declares `^3.436.0`. Add the presigner **after** that branch
> lands, matching whatever range it settles on. Do not add it now.

```ts
protected async _presignUpload(meta: ObjectMeta, expiresIn: number): Promise<PresignedUpload> {
  if (this.config.encryption) {
    throw new PresignNotSupportedError(
      'Cannot presign uploads on an SSE-C encrypted bucket: the client would have to be ' +
      'given the encryption key.');
  }

  const { name, contentType, contentLength, ...rest } = meta;
  const metadata = /* same encodeURIComponent treatment as _put() */;

  const command = new PutObjectCommand({
    Bucket: this.bucket,
    Key: this.objectKey(name),
    ContentType: contentType,
    ContentLength: contentLength,
    Metadata: metadata,
  });

  const url = await getSignedUrl(this.s3client, command, { expiresIn });

  return {
    url,
    method: 'PUT',
    headers: {
      'content-type': contentType,
      'content-length': String(contentLength),
      ...Object.entries(metadata).reduce(/* → 'x-amz-meta-<k>': v */),
    },
    name,
    expiresAt: new Date(Date.now() + expiresIn * 1000),
  };
}
```

`getSignedUrl` lifts the command's headers into the URL's `X-Amz-SignedHeaders`, so the
client must replay them exactly — which is why `headers` is returned rather than left
implicit. The metadata encoding must reuse `_put()`'s `encodeURIComponent` handling so that
presigned and multipart uploads produce byte-identical metadata for the same input.

**The SSE-C guard is not optional.** Presigning an SSE-C bucket would require handing
`SSECustomerKey` to the browser.

### 5.2 GCS (`src/gcs/bucket.ts`)

No new dependency; `@google-cloud/storage` 6.12.0 signs V4 natively.

```ts
protected async _presignUpload(meta: ObjectMeta, expiresIn: number): Promise<PresignedUpload> {
  const { name, contentType, contentLength, ...rest } = meta;

  const extensionHeaders = {
    'content-length': String(contentLength),
    ...Object.entries(rest).reduce(/* → 'x-goog-meta-<k>': v */),
  };

  const [url] = await this.client
    .bucket(this.bucket)
    .file(this.objectKey(name))
    .getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + expiresIn * 1000,
      contentType,
      extensionHeaders,
    });

  return { url, method: 'PUT', headers: { 'content-type': contentType, ...extensionHeaders },
           name, expiresAt: new Date(Date.now() + expiresIn * 1000) };
}
```

No SSE-C guard is needed: `GCSBucket`'s constructor already rejects `config.encryption`.

**Two things to verify during implementation, not to assume:**

1. **Signing credentials.** V4 signing needs either a service-account key file, or the
   `iam.serviceAccounts.signBlob` permission on the runtime service account (the library
   falls back to the IAM SignBlob API). Klaro constructs `new Storage()` with default
   credentials (`klaro/seshat/src/bucketFactory.ts`), so **confirm the deployed SA holds
   `iam.serviceAccounts.signBlob` before this ships** — otherwise presigning fails at
   runtime with a credentials error that unit tests will not catch. This is the single
   most likely thing to bite in production.
2. **`Content-Length` as a signed extension header.** Signing `content-length` for a V4
   `PUT` URL is expected to work but is not something I have verified against GCS. If it
   does not enforce as intended, fall back to signing content-type and metadata only and
   note the reduced size guarantee in the docs — do not silently ship a header that looks
   enforcing but is not.

### 5.3 Local

Nothing to write. `LocalBucket` inherits `AbstractBucket._presignUpload` and throws.

---

## 6. HTTP surface — the `presign-upload` action

New file `src/actions/presign-upload.ts`, following the `MkdirActionFactory` /
`CleanupTTLFactory` shape, exported from `src/actions/index.ts`.

```ts
export type PresignUploadOptions = {
  defaultExpiresIn: number   // 900  (15 min)
  maxExpiresIn: number       // 3600 (1 h)
}

export const PresignUploadActionFactory = (options = DefaultOptions): Action => ({
  name: 'presign-upload',
  run: async (req: Request) => {
    const basePath = decodeURIComponent(req.path.substring(1));
    const { filename, contentType, contentLength, expiresIn, metadata } = req.body;
    // validate (§6.2), clamp expiresIn, then:
    return req.seshat.bucket.presignUpload({
      name: path.join(basePath, filename),
      contentType,
      contentLength,
      expiresIn: clamped,
      metadata,
    });
  },
});
```

`path.join(basePath, filename)` mirrors how `MultipartUpload` derives object names
(`src/express/routers/multipart-upload.ts`), so a presigned upload to `POST /attachments/`
lands in the same place a multipart upload to `POST /attachments/` would.

### 6.1 Wire format

```http
POST /attachments/ HTTP/1.1
content-type: application/vnd.seshat-action+json
seshat-action: presign-upload

{
  "filename": "quarterly-report.pdf",
  "contentType": "application/pdf",
  "contentLength": 4823910,
  "expiresIn": 900
}
```

```json
{
  "name": "attachments/8fK2mQ7xR4vN1pWz.pdf",
  "url": "https://storage.googleapis.com/klaro-files/acme/attachments/8fK2...pdf?X-Goog-Algorithm=...",
  "method": "PUT",
  "headers": {
    "content-type": "application/pdf",
    "content-length": "4823910",
    "x-goog-meta-originalname": "attachments/quarterly-report.pdf"
  },
  "expiresAt": "2026-07-31T14:15:00.000Z"
}
```

The client then issues exactly:

```
PUT <url>
<every header from `headers`, verbatim>
<body>
```

### 6.2 Validation

Rejected with `400` (`SeshatError` subclass, `httpCode = 400`):

- missing or non-string `filename` / `contentType`
- missing, non-integer, negative or zero `contentLength`
- `contentLength` above a configurable ceiling (default: none — the deployment sets it)
- `expiresIn` above `maxExpiresIn` — **reject rather than silently clamp**, so a caller
  asking for a 24-hour URL learns it did not get one

---

## 7. Security

### 7.1 Expiry

Default 15 minutes; deployment-configurable maximum, default 1 hour. Both flows we are
serving (a browser upload, an agent running `curl`) start within seconds of the request.

### 7.2 What the signature binds

A presigned URL is a **bearer capability**: whoever holds it can write that one object
until it expires. Binding is what keeps the blast radius to exactly one object:

| Bound | Effect |
|---|---|
| Object key | Cannot be redirected to another path |
| `Content-Type` | Cannot be uploaded as a different type than the policy approved — this is what stops `FileExtensionRestriction` being dodged at upload time |
| `Content-Length` (exact) | Cannot be used to write an unbounded object into your bucket |
| Custom metadata (incl. `originalname`) | Cannot be stripped, so Egress rename stays correct |

### 7.3 Opt-in by construction

`ExecuteActions([...])` takes an explicit action list, so no existing deployment gains
presigning by upgrading. Klaro must deliberately add `ExecuteActions([PresignUploadAction])`
to `classic.ts`'s router list — which it does not currently include at all. That Klaro-side
change is **out of scope for this repo** but is a prerequisite for the MCP work, and it
inherits `classic.ts`'s existing auth chain (Bearer token + `X-Klaro-Project-Subdomain`).

### 7.4 Accepted risks

- **Overwrite.** A presigned URL can overwrite an existing object at that key. With
  `SecureRename` the key is 16 random bytes, so collision is not a practical concern.
  Deployments *without* a rename transformer should be aware. Not guarded in v1.
- **Orphans.** If a URL is issued and the upload succeeds but the caller never registers
  the object (e.g. sia crashes between the `PUT` and the Klaro attachment record), the
  object sits in the bucket unreferenced. The existing `cleanup-ttl` action handles this
  if callers set a `ttl` metadata entry at presign time; document that as the recommended
  pattern rather than building new machinery.
- **Issuance logging.** Log every presign at `info` with object name, content type, size
  and expiry. Without it there is no audit trail for direct writes, since `stored` never fires.

---

## 8. Consequences of D4 (no confirmation step)

Deliberate, with these accepted costs:

1. **The `stored` event does not fire** for presigned uploads. Any deployment relying on
   `bucket.on('stored', ...)` must not assume it sees every write. Document prominently.
2. **`contentLength` and `etag` are not known to Seshat** at presign time. Klaro's MCP needs
   `sizeInBytes` for the attachment record, so `sia` must `HEAD`/`GET` the object through
   Seshat after the `PUT` completes, using the returned `name`. That is one extra
   round-trip and it is on the caller.
3. **A failed or abandoned upload leaves no trace.** Acceptable: nothing was written.

If (1) or (2) becomes painful, a `confirm-upload` action can be added later without
breaking this design — it slots in as an additional action, not a change to `presignUpload`.

---

## 9. Errors

```ts
// src/errors.ts
export class PresignNotSupportedError extends SeshatError {
  httpCode = 501;
}
```

`501 Not Implemented` is the honest code for all three refusal cases — backend cannot sign
(`LocalBucket`), bucket has content transformers, bucket is SSE-C encrypted. All three are
server-configuration facts, not client mistakes. Validation failures (§6.2) stay `400`.

---

## 10. Testing

### 10.1 Unit (`mocha` + `chai` + `sinon`)

- **`tests/abstract-bucket.spec.ts`** — policies invoked with the pre-rename meta;
  name transformer applied to the returned `name`; a content transformer causes
  `PresignNotSupportedError`; `expiresIn` propagated.
- **`tests/s3/bucket.spec.ts`** — using `aws-sdk-client-mock` (already a devDependency):
  the signed URL is produced, `headers` contains content-type, content-length and
  `x-amz-meta-*`, and an SSE-C bucket refuses.
- **`tests/gcs/bucket.spec.ts`** — stub `file.getSignedUrl` and assert the options passed
  (`version: 'v4'`, `action: 'write'`, expiry, `contentType`, `extensionHeaders`).
- **`tests/local/bucket.spec.ts`** — rejects with `PresignNotSupportedError`.
- **`tests/transformers/`** — `SecureRename.transformMeta` produces the same meta as
  `transform` does today, in both modes (guards the refactor).

### 10.2 Integration

- **S3 / minio** — the valuable one: `docker-compose.yml` already runs minio, which
  supports V4 presigned URLs. Full round trip — presign, `PUT` the bytes at the URL,
  then `head()` and assert name, content type and length. This is the only test that
  proves the signature is actually correct.
- **GCS / fake-gcs-server** — signed-URL support in `fsouza/fake-gcs-server` is limited.
  Attempt the round trip; if unsupported, keep GCS at unit level and **say so in the test
  file**, rather than leaving a silent coverage gap.

### 10.3 formaldoc / webspicy

- `formaldoc/test-suite/actions/presign-upload/post.yml`, following the shape of
  `actions/mkdir/post.yml`.
- Add a `PresignedUpload` type to `formaldoc/schema.fio`.
- A postcondition asserting the object is retrievable after uploading to the signed URL.

---

## 11. Documentation

- `examples/presigned-upload.ts` — an S3 bucket with `SecureRename` and
  `ExecuteActions([PresignUploadAction])`, plus the `curl` invocation for the second leg.
  Register it in `examples/index.ts`.
- `README.md` — a bullet in the examples list, and a short section covering the
  transformer trade-off and the `stored`-event caveat.
- `CHANGELOG.md` — 2.10.0: the feature, the `Bucket` interface addition (§3.2), and the
  `ObjectMetaTransformer` extension point.

---

## 12. Work breakdown

Ordered so each step is independently reviewable. Steps 1–2 are pure refactor with no
behaviour change and can land first.

| # | Step | Touches |
|---|---|---|
| 1 | `ObjectMetaTransformer` + `isMetaTransformer` | `src/types.ts` |
| 2 | `SecureRename` refactored onto `transformMeta` | `src/transformers/secure-rename.ts` |
| 3 | `PresignNotSupportedError` | `src/errors.ts` |
| 4 | `PresignedUploadRequest` / `PresignedUpload`, `Bucket.presignUpload` | `src/types.ts` |
| 5 | `presignUpload` + `transformMetaOnly` + default `_presignUpload` | `src/abstract-bucket.ts` |
| 6 | S3 `_presignUpload` (+ presigner dependency) | `src/s3/bucket.ts`, `package.json` |
| 7 | GCS `_presignUpload` | `src/gcs/bucket.ts` |
| 8 | `presign-upload` action | `src/actions/presign-upload.ts`, `src/actions/index.ts` |
| 9 | Unit tests | `tests/**` |
| 10 | minio integration + formaldoc | `formaldoc/**` |
| 11 | Example, README, CHANGELOG | `examples/**`, docs |

**Sequencing:** step 6 adds a dependency and must wait for `chore/deps-upgrade-2026-07`
to land so the presigner version matches the settled `@aws-sdk/client-s3` range. Steps
1–5 and 7 are unaffected and can proceed in parallel with that branch.

---

## 13. Open questions

1. **GCS `signBlob` permission** — verify on Klaro's deployed service account before
   committing to this approach (§5.2). The highest-risk unknown here.
2. **`Content-Length` binding on GCS V4** — verify enforcement; fall back and document if
   it does not hold (§5.2).
3. **Local development** — Klaro runs `LocalBucket` when `SESHAT_PERSISTENCE_MODE=local`,
   so with D5 the MCP attachment flow cannot be exercised locally; developers would need
   to point at a real GCS bucket. If that proves too painful, the escape hatch is a
   Seshat-native HMAC-signed upload token pointing back at a Seshat endpoint — uniform
   across backends and able to run the *full* transformer pipeline. Explicitly deferred,
   and nothing in this design forecloses it.
4. **Per-deployment `contentLength` ceiling** — worth a `maxContentLength` option on the
   action, or left to the reverse proxy?
