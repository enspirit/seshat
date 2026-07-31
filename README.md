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

# Breaking Changes

## 3.0.0 — ESM only

Seshat 3 is published as an ESM-only package. There is no CommonJS build, so
`require('@enspirit/seshat')` now fails with `ERR_REQUIRE_ESM`.

If your project is already ESM — `"type": "module"` in your package.json —
nothing changes:

```js
import { createApp, S3Bucket } from '@enspirit/seshat';
```

If your project is CommonJS, either convert it to ESM, or reach Seshat through
a dynamic import, which is available inside CommonJS:

```js
const { createApp, S3Bucket } = await import('@enspirit/seshat');
```

Note that a dynamic `import()` returns a promise, so it has to be awaited
somewhere — at the top level of an async bootstrap function, typically.

Seshat 3 also requires **Node 22 or later**, and upgrades to **Express 5**. If
you mount Seshat's routers into your own Express app, that app has to be on
Express 5 too.

## http protocol

Seshat v2's HTTP layer has some breaking changes compared to v1:
### POST

* v1 supported multiple file uploads via `multipart/form-data` but never returned anything else than a `204` status code with a `Location` header with the first object's public url. v2 returns an actual JSON payload with an array of object metadata.
