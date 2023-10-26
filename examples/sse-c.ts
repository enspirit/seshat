import { Express } from 'express';
import { createApp, S3Bucket } from '../src';
import { S3Client } from '@aws-sdk/client-s3';

/**
 * This simple example shows how to provide custom encryption key
 * to perform SSE-C (server side encryption with customer keys)
 * on s3 backed buckets
 */
export default (expressApp: Express) => {
  expressApp.use('/sse', createApp({
    bucket: new S3Bucket({
      s3client,
      bucket: 'my-s3-bucket',
      encryption: {
        alg: 'AES256',
        key: '01234567890123456789012345678901',
      },
    }),
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

