import { Express } from 'express';
import { createApp, S3Bucket } from '../src';
import { ObjectCompressor } from '../src/transformers';
import { s3client } from './s3';

/**
 * This simple example shows how a bucket can use object transformers.
 *
 * In this specific example, we are compressing the uploaded files
 * using the gzip compression algorithm and then storing on an s3 bucket.
 */
const gzip = new ObjectCompressor();
export default (expressApp: Express, _seshatRootDir: string) => {

  expressApp.use('/gzip', createApp({
    bucket: new S3Bucket({ s3client, bucket: 'my-s3-bucket' }, [], [gzip]),
  }));

};
