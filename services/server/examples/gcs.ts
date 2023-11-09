import { Express } from 'express';
import { createApp, GCSBucket } from '../src';
import { Storage } from '@google-cloud/storage';

/**
 * This simple example shows how to add a seshat endpoint
 * serving a GCS bucket to an existing express app.
 *
 * In this specific example, we are serving the "my-gcs-bucket" bucket
 * present in the fake-gcs-server setup running in docker (see docker-compose.yaml)
 */
export default (expressApp: Express) => {
  expressApp.use('/gcs', createApp({
    bucket: new GCSBucket({ client, bucket: 'my-gcs-bucket' }),
  }));

};

/** Exposing the s3 client so that other examples can reuse it */
export const client = new Storage({
  apiEndpoint: 'http://gcs:4443',
});

