'use strict';

const _ = require('lodash');
const path = require('path');
const express = require('express');
const fileUpload = require('./bucket/file-upload');
const fileRetrieve = require('./bucket/file-retrieve');
const fileList = require('./bucket/file-list');
const fileDelete = require('./bucket/file-delete');
const direntMiddleware = require('./bucket/dirent-mw');

const DEFAULTS = {
  uploadPage: true
};

module.exports = (config) => {
  const router = express.Router();

  // Merge with defaults
  config = _.merge(DEFAULTS, config);

  router.use(direntMiddleware(config));

  router.use('/', fileList(config));
  router.use('/', fileUpload(config));
  router.use('/', fileRetrieve(config));
  router.use('/', fileDelete(config));

  return router;
};
