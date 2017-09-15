'use strict';

const inspect = require('util').inspect;
const Promise = require('bluebird');

module.exports = () => {
  return {
    process: (file) => {
      console.log('DEBUG:', inspect(file));
      return Promise.resolve(file);
    }
  };
};
