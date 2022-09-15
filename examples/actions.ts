import { Express } from 'express';
import { createApp, LocalBucket, S3Bucket } from '../src';
import { MkdirAction } from '../src/actions';
import { ExecuteActions } from '../src/express/routers';
import { s3client } from './s3';

/**
 * This example shows how actions can be executed on a bucket.
 *
 * In this specific example, we are giving the ability to create
 * folders on both local or s3 buckets
 */
export default (expressApp: Express, seshatRootDir: string) => {

  expressApp.use('/actions/local', createApp({
    bucket: new LocalBucket({ path: seshatRootDir }),
    routers: [
      ExecuteActions([MkdirAction]),
    ],
  }));

  expressApp.use('/actions/s3', createApp({
    bucket: new S3Bucket({ s3client, bucket: 'my-s3-bucket' }),
    routers: [
      ExecuteActions([MkdirAction]),
    ],
  }));

};
