import express from 'express';
import { Config } from './types';

import errorHandler from './express/middlewares/error-handler';

import { createRouter as executeActions } from './express/routers/execute-actions';
import { createRouter as busboyUploader } from './express/routers/multipart-uploads';
import { createRouter as retrieveObject } from './express/routers/retrieve-object';
import { createRouter as deleteObject } from './express/routers/delete-object';

import morgan from 'morgan';

export const createApp = (config: Config): express.Express => {
  const app = express();
  const { middlewares } = config;

  // Logging
  app.use(morgan('tiny'));

  (middlewares || []).forEach((mw) => app.use(mw(config)));

  app.use(executeActions(config));
  app.use(busboyUploader(config));
  app.use(deleteObject(config));
  app.use(retrieveObject(config));

  app.use(errorHandler);

  return app;
};
