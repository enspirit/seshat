'use strict';

const winston = require('winston');

winston.configure({
  transports: [
    new winston.transports.Console({
      json: false,
      colorize: true
    })
  ]
});

winston.level = 'debug';

module.exports = winston;
