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
app.use(express.static('public'));

const fileUpload = require('./routers/file-upload');
const fileRetrieve = require('./routers/file-retrieve');
const LocalStorage = require('./lib/storage/local');

const tmpStorage = new LocalStorage('./tmp');
app.use('/', fileUpload(tmpStorage));
app.use('/', fileRetrieve(tmpStorage));

//
app.disable('x-powered-by');

module.exports = app;
