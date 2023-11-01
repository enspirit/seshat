import { Express, Request } from 'express';
import { BucketPolicy, BucketPolicyError, createApp, ObjectMeta, S3Bucket } from '../src';
import { s3client } from './s3';

export const authPolicy: BucketPolicy = {
  async head(_path: string, req: Request) {
    ensureAuthenticated(req);
  },
  async get(_path: string, req: Request) {
    ensureAuthenticated(req);
  },
  async put(_meta: ObjectMeta, req: Request) {
    ensureAuthenticated(req);
  },
  async delete(_path: string, req: Request) {
    ensureAuthenticated(req);
  },
  async list(_path: string, req: Request) {
    ensureAuthenticated(req);
  },
  async mkdir(_path: string, req: Request) {
    ensureAuthenticated(req);
  },
};

const ensureAuthenticated = (req: Request) => {
  if (req.headers?.authorization !== 'Bearer a-very-special-secret') {
    throw new BucketPolicyError('Unauthorized');
  }
};

/**
 * This example combines a custom policy that only allows for authentication.
 *
 * (bucket based on an s3 bucket)
 */
export default (expressApp: Express, _seshatRootDir: string) => {

  expressApp.use('/authentication', createApp({
    bucket: new S3Bucket({
      s3client,
      bucket: 'my-s3-bucket',
      policies: [authPolicy],
    }),
  }));

};
