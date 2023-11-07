import express from 'express';
import defaultLogger from '../logger';
import { Config } from '../types';
import { ErrorLogger, RequestLogger } from './middlewares';
import { ExposeContext } from './middlewares/context';

export * from './routers';

import {
  ExecuteActions,
  MultipartUpload,
  RetrieveObjects,
  DeleteObjects,
  ListObjects,
} from './routers';

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
