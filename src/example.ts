import path = require('path');
import { createApp } from './express';
import LocalBucket from './local/bucket';
import SeshatMiddlewares from './express/middlewares';
import { Request, Response, NextFunction } from 'express';

import express from 'express';
import S3Bucket from './s3/bucket';
import { S3Client } from '@aws-sdk/client-s3';

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
 * On '/s3' we expose a seshat bucket based on a s3 bucket (connecting to minio, see docker-compose)
 */
const s3client = new S3Client({
  region: 'eu-west1',
  credentials: {
    accessKeyId: 'access-key',
    secretAccessKey: 'secret-key',
  },
  endpoint: process.env.S3_ENDPOINT || 'http://127.0.0.1:9000',
  forcePathStyle: true,
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
