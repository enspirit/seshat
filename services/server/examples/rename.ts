import { Express } from 'express';
import { createApp, S3Bucket } from '../src';
import { SecureRename } from '../src/transformers';
import { s3client } from './s3';

/**
 * This simple example shows how a bucket can use policies to allow/disallow actions.
 *
 * In this specific example, we use the read-only policy to ensure no objects can be created/modified/deleted.
 *
 * (bucket based on a local folder serving the root folder of this project)
 */
export default (expressApp: Express, _seshatRootDir: string) => {

  expressApp.use('/rename', createApp({
    bucket: new S3Bucket({ s3client, bucket: 'my-s3-bucket', transformers: [new SecureRename()] }),
  }));

};
