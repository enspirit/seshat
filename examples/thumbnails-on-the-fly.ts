import { Express } from 'express';
import { createApp, S3Bucket } from '../src';
import { SharpTransformer } from '../src/transformers/sharp';
import { s3client } from './s3';

// Reuse the policy from the other example
import { imagesOnlyPolicy } from './thumbnails';

/**
 * This example is similar to the 'thumbnails' example as it combines a custom policy
 * that only allows image files and a transformer that resize the images to a thumbnail-like size.
 *
 * The difference is that this transformer is used as an Egress transformer, which means it transforms
 * the objects when we get them from the bucket, not when we store them on it.
 *
 * (bucket based on an s3 bucket)
 */
export default (expressApp: Express, _seshatRootDir: string) => {

  const imageResizer = new SharpTransformer({
    output: {
      format: 'jpg',
    },
    resize: {
      width: 400,
    },
    withMetadata: true,
  }, 'Egress');

  expressApp.use('/thumbnails-on-the-fly', createApp({
    bucket: new S3Bucket({
      s3client,
      bucket: 'my-s3-bucket',
      policies: [imagesOnlyPolicy],
      transformers: [imageResizer],
    }),
  }));

};
