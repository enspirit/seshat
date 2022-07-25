import { Express } from 'express';
import { createApp, S3Bucket } from '../src';
import { S3Client } from '@aws-sdk/client-s3';

/**
 * This simple example shows how to add a seshat endpoint
 * serving a s3 bucket to an existing express app.
 *
 * In this specific example, we are serving the "my-s3-bucket" bucket
 * present in the minio setup running in docker (see docker-compose.yaml)
 */
export default (expressApp: Express) => {
  expressApp.use('/s3', createApp({
    bucket: new S3Bucket({ s3client, bucket: 'my-s3-bucket' }),
  }));

};

/** Exposing the s3 client so that other examples can reuse it */
export const s3client = new S3Client({
  region: 'eu-west1',
  credentials: {
    accessKeyId: 'access-key',
    secretAccessKey: 'secret-key',
  },
  endpoint: process.env.S3_ENDPOINT || 'http://127.0.0.1:9000',
  forcePathStyle: true,
});

