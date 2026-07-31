## 3.0.0-rc.1 - 2026-07-31

Release candidate. Published under the `rc` dist-tag, so `npm install
@enspirit/seshat` still resolves to 2.9.0. To try it:

```
npm install @enspirit/seshat@rc
```

**Seshat is now an ESM-only package.** See the
[Breaking Changes](README.md#300--esm-only) section of the README for what that
means in practice.

* The package is ESM-only (`"type": "module"`) and no longer ships a CommonJS
  build. CommonJS consumers are not locked out: Node 22.12+ supports
  `require()` of an ESM package, and Seshat's module graph contains no
  top-level `await`, which is the only thing that would prevent it. A dynamic
  `import()` works too.

* The exported `Object` and `ObjectMeta` types are renamed to `SeshatObject`
  and `SeshatObjectMeta`. `Object` shadowed the JavaScript global, which could
  break `Object.keys`/`Object.entries` in any module that imported it, and
  `ObjectMeta` follows for consistency. No aliases are kept. The backend
  classes (`S3ObjectMeta`, `GCSObjectMeta`, `LocalObject`) and the
  `ObjectTransformer*` types are unchanged.

* Minimum Node version is now 22.12 — the release where `require()` of an ESM
  package became available unflagged, which is what keeps CommonJS consumers
  working. Node 20 reached end of life in April 2026.

* Express 5. The routing layer moved from Express 4, which changes how a bare
  slash after a mount path is resolved — `GET /s3//` now addresses the bucket
  root, as it did before, but only because Seshat normalises it explicitly.

* Dependencies upgraded across the board, including @google-cloud/storage 7,
  sharp 0.35, mime-types 3 and body-parser 2. `npm audit` goes from 46
  findings (3 critical) to 3, all of them dev-only.

* Toolchain: TypeScript 5.9, mocha 11, and tsx in place of the unmaintained
  ts-node.

## 2.9.0 - 2025-11-13

* Add support for Cache-Control header in RetrieveObject. Default value
  is set to 'private, max-age=86400, must-revalidate', which is compatible
  with usual seshat use.

* RetrieveObject now supports a deep partial config, allowing to only pass
  configuration settings that differ from the default config.

## 2.8.3 - 2023-11-09

* Fix bug for S3 SSE-C

## 2.8.2 - 2023-11-02

* Init clamav client on first transformer usage

## 2.8.1 - 2023-10-31

* Fix stream error handling on local storage.

## 2.8.0 - 2023-10-31

* Support for custom object metadata
* New action 'cleanup-ttl'
* Deprecate actions objects in favor of action factories

## 2.7.0 - 2023-10-30

* Support for virus scanning with ClamAV
* Change Error schema to include code & message

## 2.6.0 - 2023-10-26

* Support for SSE-C for S3-backed buckets

## 2.5.1 - 2023-06-09

* Improve error logging to include details about Error instances
* Transformer errors subclassing SeshatError bubble up

## 2.5.0 - 2023-06-09

* Extend archive action capabilities
* Upgraded webspicy to 0.25 and moved caching postconditions there

## 2.4.4 - 2023-06-09

* Fix support for Last-Modified/ETag caching protocol (LocalStorage)

## 2.4.3 - 2023-06-08

* Fix support for Last-Modified/ETag caching protocol

## ... TODO: documenting changes

## 2.0.0 - 2022-07-27

* Total rewrite in Typescript
