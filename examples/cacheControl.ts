import { type Express } from 'express';
import { createApp, DeleteObjects, LocalBucket, MultipartUpload, RetrieveObjects } from '../src/index.js';

/**
 * This simple example shows how to set a Cache-Control header on
 * RetrieveObjects. Seshat sends none by default.
 */
export default (expressApp: Express, seshatRootDir: string) => {

  expressApp.use('/default-cache', createApp({
    bucket: new LocalBucket({ path: seshatRootDir }),
  }));

  expressApp.use('/cached', createApp({
    bucket: new LocalBucket({ path: seshatRootDir }),
    routers: [
      DeleteObjects(),
      MultipartUpload(),
      RetrieveObjects({
        headers: {
          cacheControl: 'private, max-age=86400, must-revalidate',
        },
      }),
    ],
  }));

  expressApp.use('/no-cache', createApp({
    bucket: new LocalBucket({ path: seshatRootDir }),
    routers: [
      DeleteObjects(),
      MultipartUpload(),
      RetrieveObjects({
        headers: {
          cacheControl: 'no-cache',
        },
      }),
    ],
  }));

};
