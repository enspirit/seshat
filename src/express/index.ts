import express from 'express';
import morgan from 'morgan';
import { Config } from '../types';
import errorHandler from './middlewares/error-handler';

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
