import path from 'path';
import { Express } from 'express';
import { createApp, LocalBucket } from '../src';
import { ReadOnlyPolicy } from '../src';

/**
 * This simple example shows how a bucket can use policies to allow/disallow actions.
 *
 * In this specific example, we use the read-only policy to ensure no objects can be created/modified/deleted.
 *
 * (bucket based on a local folder serving the root folder of this project)
 */
export default (expressApp: Express, seshatRootDir: string) => {

  expressApp.use('/readonly', createApp({
    bucket: new LocalBucket(seshatRootDir, [ReadOnlyPolicy]),
  }));

};
