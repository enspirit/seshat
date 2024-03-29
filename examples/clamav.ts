import { Express } from 'express';
import { createApp, LocalBucket, S3Bucket } from '../src';
import { ClamavScanner } from '../src/transformers';
import { s3client } from './s3';

/**
 * This example shows how a bucket can use the clamav transformer
 * to scan files both at upload and download time.
 *
 * In this example, we connect to the clamav instance running in the docker-compose
 * project
 */
const clamav = new ClamavScanner({
  clamdscan: {
    host: 'clamav',
    port: 3310,
  },
});
export default (expressApp: Express, seshatRootDir: string) => {

  expressApp.use('/clamav/s3', createApp({
    bucket: new S3Bucket({ s3client, bucket: 'my-s3-bucket', transformers: [clamav] }),
  }));

  expressApp.use('/clamav/local', createApp({
    bucket: new LocalBucket({ path: seshatRootDir, transformers: [clamav] }),
  }));
};
