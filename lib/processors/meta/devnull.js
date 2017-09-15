'use strict';

const Promise = require('bluebird');

module.exports = () => {
  return {
    process: (file) => {
      file.stream.resume();
      return Promise.resolve(null);
    }
  };
};

