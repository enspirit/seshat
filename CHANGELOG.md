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
