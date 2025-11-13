import { Express } from 'express';
import { createApp, DeleteObjects, LocalBucket, MultipartUpload, RetrieveObjects } from '../src';

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
        downloadAs: {
          enabled: true,
          queryParam: 'download',
        },
        headers: {
          etag: true,
          lastModified: true,
          cacheControl: 'no-cache',
        },
      }),
    ],
  }));

};
