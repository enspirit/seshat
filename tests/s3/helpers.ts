import fs from 'fs';
import path from 'path';
import S3rver from 's3rver';
export let instance: S3rver;
import S3 from 'aws-sdk/clients/s3';
import { exec } from 'child_process';

import mime from 'mime-types';

const ROOT_PROJECT_DIR = path.join(__dirname, '../../');

const S3RVER_DIR = '/tmp/s3rver_test_directory';
const SESHAT_BUCKET = 'seshat-bucket';

before((done) => {
  instance = new S3rver({
    configureBuckets: [{
      name: SESHAT_BUCKET,
      configs: [],
    }],
    port: 4569,
    address: 'localhost',
    silent: false,
    directory: S3RVER_DIR,
  }).run(done);
});

after((done) => {
  instance.close(done);
});

export const client = new S3({
  endpoint: 'http://localhost:4569',
  s3ForcePathStyle: true,
  credentials: {
    accessKeyId: 'S3RVER',
    secretAccessKey: 'S3RVER',
  },
});

export const ensureS3Object = async (key: string) => {
  const filePath = path.join(ROOT_PROJECT_DIR, key);
  await client.putObject({
    Bucket: SESHAT_BUCKET,
    Key: key,
    Body: fs.createReadStream(filePath),
    ContentType: mime.lookup(filePath) || 'application/octet-stream',
    Metadata: {
      name: key,
    },
  }).promise();
};

export const ensureS3BucketEmpty = async () => {
  await exec(`rm -rf ${S3RVER_DIR}/${SESHAT_BUCKET}/*`);
};

export const ensureNoS3Object = async (path: string) => {
  await client.deleteObject({
    Bucket: SESHAT_BUCKET,
    Key: path,
  }).promise();
};
