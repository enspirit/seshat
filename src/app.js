import _ from 'lodash';
import express from 'express';
import logger from './logger';
import expressWinston from 'express-winston';
import cors from 'cors';
import config from '../config';
import { version } from '../package.json';

const app = express();

const env = process.env.NODE_ENV || 'development';
app.locals.ENV = env;
app.locals.ENV_DEVELOPMENT = env === 'development';

// cross origin settings
app.use(cors(config.get('api.cors')));

// logging
app.use(expressWinston.logger({
  winstonInstance: logger,
  meta: false,
  expressFormat: true,
  colorize: true,
}));

// static files
import bucket from './routers/bucket';

// Mount the buckets
_.each(config.get('buckets'), (config, path) => {
  if (!config) {
    return;
  }
  if (path[path.length - 1] !== '/') {
    path += '/';
  }
  config.path = path;
  app.use(path, bucket(config));
});

app.get('/version', (req, res) => {
  res.send({ seshat: { version } });
});

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).send('Something broke!');
});

//
app.disable('x-powered-by');

export default app;
