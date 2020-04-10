'use strict';

const _ = require('lodash');
const env = process.env.NODE_ENV || 'development';
const fs = require('fs');
const path = require('path');
const logger = require('../lib/logger');

let config = require('./defaults');

if (fs.existsSync(path.join(__dirname, `${env}.js`))){
  logger.info(`Loading configuration from ${env}.js`);
  config = _.merge(config, require(`./${env}.js`));
} else {
  logger.info(`No specific configuration for ${env}`);
}

config.get = (path) => {
  return _.get(config, path);
};

module.exports = config;
