import path = require('path');
import { createApp } from './express';
import LocalBucket from './local/bucket';
import SeshatMiddlewares from './express/middlewares';
import { Request, Response, NextFunction } from 'express';

import express from 'express';
import S3Bucket from './s3/bucket';
import { S3 } from 'aws-sdk';
import S3rver = require('s3rver');

/**
 * Start a s3 compatible server (s3rver) for demo purposes
 */
new S3rver({
  configureBuckets: [{
    name: 'my-s3-bucket',
    configs: [],
  }],
  port: 4569,
  address: 'localhost',
  silent: false,
  directory: '/tmp/s3rver',
}).run();

const app = express();

/**
 * On '/local' we expose a seshat bucket based on local storage
 * exposing this project's root folder
 */
app.use('/local', createApp({
  bucket: new LocalBucket(path.join(__dirname, '../')),
  middlewares: SeshatMiddlewares,
}));

/**
 * On '/s3' we expose a seshat bucket based on a s3 bucket (s3rver)
 */
const s3client = new S3({
  endpoint: 'http://localhost:4569',
  s3ForcePathStyle: true,
  credentials: {
    accessKeyId: 'S3RVER',
    secretAccessKey: 'S3RVER',
  },
});
app.use('/s3', createApp({
  bucket: new S3Bucket({ s3client, bucket: 'my-s3-bucket' }),
  middlewares: SeshatMiddlewares,
}));

/**
 * Error logging
 */
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(3000, () => {
  console.log('Seshat is running on http://localhost:3000');
});
