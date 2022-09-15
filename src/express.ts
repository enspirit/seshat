import express from 'express';
import { Config } from './types';

import errorHandler from './express/middlewares/error-handler';

import {
  ExecuteActions,
  MultipartUpload,
  RetrieveObjects,
  DeleteObjects,
  ListObjects,
} from './express/routers';

const DefaultRouters = [
  ExecuteActions(),
  MultipartUpload(),
  RetrieveObjects(),
  ListObjects(),
  DeleteObjects(),
];

import morgan from 'morgan';

export const createApp = (config: Config): express.Express => {
  const app = express();

  // Logging
  app.use(morgan('tiny'));

  // Use specified/default routers
  (config.routers || DefaultRouters).forEach((factory) => {
    const router = factory(config.bucket);
    app.use(router);
  });

  app.use(errorHandler);

  return app;
};
