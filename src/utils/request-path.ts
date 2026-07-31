import { Request } from 'express';

/**
 * The request path a router should resolve against its bucket, with any
 * duplicated leading slashes collapsed into one.
 *
 * When a router is mounted under a prefix, Express 4 collapsed whatever was
 * left after stripping that prefix, so `GET /s3//` arrived as '/'. Express 5
 * hands it over untouched as '//', which would make `/s3//` address a '/'
 * prefix inside the bucket rather than its root - a listing that legitimately
 * exists on a filesystem bucket and never matches on S3.
 *
 * The result keeps its single leading slash; callers strip it themselves, and
 * still decode afterwards so that percent-encoded separators inside an object
 * name survive as they always did.
 */
export const requestPath = (req: Request): string => {
  return req.path.replace(/^\/+/, '/');
};
