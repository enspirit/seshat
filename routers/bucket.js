'use strict';

const _ = require('lodash');
const path = require('path');
const express = require('express');
const fileUpload = require('./bucket/file-upload');
const fileRetrieve = require('./bucket/file-retrieve');

const DEFAULTS = {
  uploadPage: true
};

module.exports = (config) => {
  const router = express.Router();

  // Merge with defaults
  config = _.merge(DEFAULTS, config);

  if (config.uploadPage) {
    router.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, './bucket/index.html'));
    });
  }

  router.use('/', fileUpload(config));
  router.use('/', fileRetrieve(config));

  return router;
};
