import { Express } from 'express';
import { BucketPolicy, createApp, S3Bucket } from '../src';
import { ObjectMeta } from '@enspirit/seshat-commons';
import { BucketPolicyError } from '@enspirit/seshat-commons';
import { SharpTransformer } from '../src/transformers/sharp';
import { s3client } from './s3';

export const imagesOnlyPolicy: BucketPolicy = {
  async head(_path: string) {
  },
  async get(_path: string) {
  },
  async put(meta: ObjectMeta) {
    if (!meta.contentType.startsWith('image/')) {
      throw new BucketPolicyError('Only images are allowed in this bucket.');
    }
  },
  async delete(_path: string) {
  },
  async list(_prefix?: string) {
  },
  async mkdir(_prefix?: string) {
  },
};

/**
 * This example combines a custom policy that only allows image files and
 * a transformer that resize the images to a thumbnail-like size.
 *
 * (bucket based on an s3 bucket)
 */
export default (expressApp: Express, _seshatRootDir: string) => {

  const imageResizer = new SharpTransformer({
    output: {
      format: 'png',
    },
    resize: {
      width: 400,
    },
  });

  expressApp.use('/thumbnails', createApp({
    bucket: new S3Bucket({
      s3client,
      bucket: 'my-s3-bucket',
      policies: [imagesOnlyPolicy],
      transformers: [imageResizer],
    }),
  }));

};
