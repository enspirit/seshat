'use strict';

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
const LocalStorage = require('./lib/storage/local');

const tmpStorage = new LocalStorage('./tmp');
app.use('/', bucket(tmpStorage));

//
app.disable('x-powered-by');

module.exports = app;
