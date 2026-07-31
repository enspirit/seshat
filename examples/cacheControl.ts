import { type Express } from 'express';
import { createApp, DeleteObjects, LocalBucket, MultipartUpload, RetrieveObjects } from '../src/index.js';

/**
 * This simple example shows how to override the default
 * Cache-Control header on RetrieveObjects.
 */
export default (expressApp: Express, seshatRootDir: string) => {

  expressApp.use('/default-cache', createApp({
    bucket: new LocalBucket({ path: seshatRootDir }),
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
