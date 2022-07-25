import path from 'path';
import { Express } from 'express';
import { createApp, LocalBucket } from '../src';

/**
 * This simple example shows how to add a seshat endpoint
 * serving a local folder to an existing express app.
 *
 * In this specific example, we are using the root folder
 * of this project as the root of the bucket and exposing the
 * seshat API on /local.
 */
export default (expressApp: Express) => {
  expressApp.use('/local', createApp({
    bucket: new LocalBucket(path.join(__dirname, '../')),
  }));
};
