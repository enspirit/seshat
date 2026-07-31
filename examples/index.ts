import express, { type NextFunction, type Request, type Response } from 'express';

import localExample from './local.js';
import s3example from './s3.js';
import gcsexample from './gcs.js';
import gzipExample from './gzip.js';
import authenticationExample from './authentication.js';
import readOnlyExample from './readonly.js';
import renameExample from './rename.js';
import thumbnailsExample from './thumbnails.js';
import thumbnailsOnTheFlyExample from './thumbnails-on-the-fly.js';
import actionsExample from './actions.js';
import sseExample from './sse-c.js';
import clamavExample from './clamav.js';
import cacheControlExample from './cacheControl.js';

import { version } from '../src/index.js';
import logger from '../src/logger.js';

const app = express();
app.set('etag', 'strong');

// Mount all examples
[
  localExample,
  s3example,
  gcsexample,
  gzipExample,
  authenticationExample,
  readOnlyExample,
  renameExample,
  thumbnailsExample,
  thumbnailsOnTheFlyExample,
  actionsExample,
  sseExample,
  clamavExample,
  cacheControlExample,
].forEach((example) => example(app, process.env.ROOT_DIR || '../'));

app.listen(3000, () => {
  logger.info(`Seshat ${version} is running on http://localhost:3000`);
});
