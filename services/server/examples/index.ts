import express from 'express';

import localExample from './local';
import s3example from './s3';
import gcsexample from './gcs';
import gzipExample from './gzip';
import authenticationExample from './authentication';
import readOnlyExample from './readonly';
import renameExample from './rename';
import thumbnailsExample from './thumbnails';
import thumbnailsOnTheFlyExample from './thumbnails-on-the-fly';
import actionsExample from './actions';
import sseExample from './sse-c';
import clamavExample from './clamav';
import cors from 'cors';

import { version } from '../src';
import logger from '../src/logger';

const app = express();
app.use(cors());
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
].forEach((example) => example(app, process.env.ROOT_DIR || '../'));

app.listen(3000, () => {
  logger.info(`Seshat ${version} is running on http://localhost:3000`);
});
