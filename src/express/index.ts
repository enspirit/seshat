import express from 'express';
import defaultLogger from '../logger.js';
import type { Config } from '../types.js';
import { ErrorLogger, RequestLogger } from './middlewares/index.js';
import { ExposeContext } from './middlewares/context.js';

export * from './routers/index.js';

import {
  ExecuteActions,
  MultipartUpload,
  RetrieveObjects,
  DeleteObjects,
  ListObjects,
} from './routers/index.js';

const DefaultRouters = [
  ExecuteActions(),
  MultipartUpload(),
  RetrieveObjects(),
  ListObjects(),
  DeleteObjects(),
];

export const createApp = (config: Config): express.Express => {
  config.logger ||= defaultLogger;

  const app = express();

  // Expose bucket, logger, ...
  app.use(ExposeContext(config));

  // Log requests
  app.use(RequestLogger);

  // Use specified/default routers
  (config.routers || DefaultRouters).forEach((factory) => {
    const router = factory(config.bucket);
    app.use(router);
  });

  // Log errors
  app.use(ErrorLogger);

  return app;
};
