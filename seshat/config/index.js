'use strict';

const env = process.env.NODE_ENV || 'development';

import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import logger from '../src/logger';
import defaults from './defaults';

let config = Object.assign({}, defaults);

if (fs.existsSync(path.join(__dirname, `${env}.js`))) {
  logger.info(`Loading configuration from ${env}.js`);
  config = _.merge(config, require(`./${env}.js`));
} else {
  logger.info(`No specific configuration for ${env}`);
}

config.get = (path) => {
  return _.get(config, path);
};

export default config;
