# Seshat

Seshat provides a way to interact with storage (be it local, gcs, s3, ...) using HTTP while providing ways to implement things such as:

* access-control (not everyone can do the same things on objects)
* avoid file collision (many people want to upload files with the same name, they shouldn't override each other)
* transform files upon upload (compressing, image cropping, ...)
* async vs sync file processing upon uploads
* ...

# How?

Seshat provides express-based middlewares and routers that can be used in any [express](https://expressjs.com/) app in order to serve/accept files.

# Vocabulary

Most of the vocabulary used in seshat reuses concept shared by many cloud storage solution such as [S3](https://aws.amazon.com/s3/) and [GCS](https://cloud.google.com/storage) such as **Bucket** and **Object**.

A **Bucket** is a storage place where **Objects** can be written. In Seshat, a Bucket can be backed by a local storage (your disk) an S3 Bucket, a GCS Bucket or even a certain prefix on an S3/GCS bucket.

*Policies* provides us with an easy way to implement things like access control, ready-only buckets or buckets that only accept a certain kind of objects.

*Transformers* allow us to transform objects as they are being uploaded or retrieved from a bucket. (eg. resize an image, compress files, ...)

# Examples

Please have a look at the [examples/](examples/) folder, you'll find simples examples showcasing:

* [serving files from a local storage](examples/local.ts)
* [serving files from an S3 bucket](examples/s3.ts)
* [use policies to make a bucket read-only](examples/readonly.ts)
* [rename objects as they are uploaded](examples/rename.ts)
* [compress objects as they are uploaded](examples/gzip.ts)
* [create thumbnails from uploaded images](examples/thumbnails.ts)
