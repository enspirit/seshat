# Seshat

Seshat aims at providing an easy way to interact with storage (be it local, gcs, s3, ...) while providing easy ways to implement:

* access-control (not everyone can do the same things on objects)
* avoid file collision (many people want to upload files with the same name, they shouldn't override each other)
* transform files upon upload (compressing, image cropping, ...)
* async vs sync file processing upon uploads
