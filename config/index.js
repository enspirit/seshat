'use strict';

const _ = require('lodash');
const env = process.ENV || 'development';
const fs = require('fs');
const path = require('path');

let config = require('./defaults');

if (fs.existsSync(path.join(__dirname, `${env}.js`))){
  config = _.merge(config, require(`./${env}.js`));
}

config.get = (path) => {
  return _.get(config, path);
};

module.exports = config;