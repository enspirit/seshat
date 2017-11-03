'use strict';

const _ = require('lodash');
const express = require('express');
const logger = require('./lib/logger');
const expressWinston = require('express-winston');
const cors = require('cors');
const config = require('./config');

let app = express();

const env = process.env.NODE_ENV || 'development';
app.locals.ENV = env;
app.locals.ENV_DEVELOPMENT = env == 'development';

// cross origin settings
app.use(cors(config.get('api.cors')));

// logging
app.use(expressWinston.logger({
  winstonInstance: logger,
  meta: false,
  expressFormat: true,
  colorize: true
}));

// static files
const bucket = require('./routers/bucket');

// Mount the buckets
_.each(config.get('buckets'), (config, path) => {
  if (!config) {
    return;
  }
  if (path[path.length - 1] != '/') {
    path += '/';
  }
  config.path = path;
  app.use(path, bucket(config));
});

//
app.disable('x-powered-by');

module.exports = app;
