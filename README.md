# Seshat

![SeshatLogo](assets/seshat.jpg)

:warning: This is a complete rewrite of Seshat. If you're looking for the v1, [please head to the v1 branch](https://github.com/enspirit/seshat/tree/v1) :warning:

See the [Breaking Changes](#breaking-changes) section for incompatibilities between v1 & v2.

---

Seshat provides a way to interact with storage (be it local, gcs, s3, ...) using HTTP while providing ways to implement things such as:

* access-control (not everyone can do the same things on objects)
* avoid file collision (many people want to upload files with the same name, they shouldn't override each other)
* transform files upon upload (compressing, image cropping, ...)
* async vs sync file processing upon uploads
* ...

# How?

Seshat provides a series of middlewares and routers that can be used in any [express](https://expressjs.com/) app in order to serve/accept files.

# Vocabulary

Most of the vocabulary used in seshat reuses concept shared by many cloud storage solution such as [S3](https://aws.amazon.com/s3/) and [GCS](https://cloud.google.com/storage) such as **Bucket** and **Object**.

A **Bucket** is a storage place where **Objects** can be written. In Seshat, a Bucket can be backed by a local storage (your disk) an S3 Bucket, a GCS Bucket or even a certain prefix on an S3/GCS bucket.

*Policies* provides us with an easy way to implement things like access control, ready-only buckets or buckets that only accept a certain kind of objects.

*Transformers* allow us to transform objects as they are being uploaded or retrieved from a bucket. (eg. resize an image, compress files, ...)

# Examples

Please have a look at the [examples/](examples/) folder, you'll find simple examples showcasing:

* [serving files from a local storage](examples/local.ts)
* [serving files from an S3 bucket](examples/s3.ts)
* [use middlewares to ensure requests come from valid users](examples/authentication.ts)
* [use policies to make a bucket read-only](examples/readonly.ts)
* [rename objects as they are uploaded](examples/rename.ts)
* [compress objects as they are uploaded](examples/gzip.ts)
* [create thumbnails from uploaded images](examples/thumbnails.ts)
* [create thumbnails on-the-fly when recovering files](examples/thumbnails-on-the-fly.ts.ts)
* [scan files for viruses using clamav](examples/clamav.ts)
* [encrypt files using SSE-C](examples/sse-c.ts)
* [execute actions such as creating empty prefixes and extract objects as zip files](examples/actions.ts)
* [hand out presigned URLs so clients upload straight to storage](examples/presigned-upload.ts)

# Presigned uploads

A presigned upload hands the caller a short-lived URL it `PUT`s the bytes to
directly. The bytes never pass through Seshat, which is worth doing for large
files, or when whoever holds them — a browser, an agent on someone's laptop —
can make an HTTP request but must not be given bucket credentials.

Enable it by adding the action to a bucket's routers:

```ts
createApp({
  bucket: new S3Bucket({ s3client, bucket: 'my-bucket', transformers: [new SecureRename()] }),
  routers: [ExecuteActions([PresignUploadAction]), RetrieveObjects(), ListObjects()],
});
```

No existing deployment gains presigning by upgrading: `ExecuteActions` takes an
explicit list.

**Two things it costs you.** Content transformers cannot run — Seshat never sees
the bytes, so it cannot scan, resize or compress them. A bucket configured with
one refuses to presign rather than quietly dropping the guarantee; name-only
transformers such as `SecureRename` still apply. And the `stored` event does not
fire, because this process never learns whether the upload happened; callers
that need to know should `HEAD` the object afterwards using the returned `name`.

**What the signature binds:** the object key, the exact content length, the
content type, and any custom metadata. A holder of the URL can write that one
object, at that size and type, until it expires — and nothing else.

Custom metadata values must be strings, and are stored as backend custom
metadata under whatever keys you give. They never override the object key,
content type or content length — those come from the request path and the
validated request body, so a `metadata` entry cannot move the object or widen
the size the action approved.

**Backends.** S3 and GCS only. `LocalBucket` refuses with `501`: a filesystem has
no signing authority.

**An S3 client used for presigning must be built with
`requestChecksumCalculation: 'WHEN_REQUIRED'`.** Left at its default the SDK
computes a checksum of the request body and the signer binds it into the URL —
but the body is empty at signing time, so the upload is rejected on arrival.
Seshat refuses to presign with such a client rather than handing out URLs that
fail later. Pass `presignClient` when the signing client has to differ from the
one doing ordinary reads and writes, which is also what you need when storage
sits behind a private network: the signature covers the `Host` header, so the URL
must name an address its holder can actually reach.

# Installing

```
npm install @enspirit/seshat
```

Read the Breaking Changes below before you upgrade — 3.0.0 is ESM-only,
requires Node 22.12+, and moves to Express 5.

# Breaking Changes

## 3.0.0 — ESM only

Seshat 3 ships as an ESM-only package: there is no CommonJS build any more.

If your project is already ESM — `"type": "module"` in your package.json —
nothing changes:

```js
import { createApp, S3Bucket } from '@enspirit/seshat';
```

**CommonJS projects still work.** Seshat 3 requires Node 22.12 or later, and
from that version Node supports `require()` of an ESM package directly:

```js
const { createApp, S3Bucket } = require('@enspirit/seshat');
```

This works because Seshat's module graph contains no top-level `await`, which
is the one thing that makes `require()` of an ESM module fail. If you would
rather be explicit, a dynamic import does the same job:

```js
const { createApp, S3Bucket } = await import('@enspirit/seshat');
```

The practical consequence of the ESM switch, then, is the **Node 22.12 floor**
rather than a rewrite of your application.

Seshat 3 also upgrades to **Express 5**. If you mount Seshat's routers into
your own Express app, that app has to be on Express 5 too — that is likely to
be the more disruptive change of the two.

## 3.0.0 — `Object` and `ObjectMeta` are now `SeshatObject` and `SeshatObjectMeta`

The two core exported types have been renamed:

```js
// before
import { Object, ObjectMeta } from '@enspirit/seshat';

// after
import { SeshatObject, SeshatObjectMeta } from '@enspirit/seshat';
```

`Object` shadowed the JavaScript global of the same name, which made it a
genuine hazard — importing it into a module could break ordinary `Object.keys`
and `Object.entries` calls in that file. No deprecated alias is kept, since
exporting the old name would reintroduce exactly that problem. `ObjectMeta`
follows for consistency.

The backend-specific classes keep their names: `S3ObjectMeta`, `GCSObjectMeta`
and `LocalObject` are unchanged, as are `ObjectTransformer` and the other
`ObjectTransformer*` types.

## http protocol

Seshat v2's HTTP layer has some breaking changes compared to v1:
### POST

* v1 supported multiple file uploads via `multipart/form-data` but never returned anything else than a `204` status code with a `Location` header with the first object's public url. v2 returns an actual JSON payload with an array of object metadata.
