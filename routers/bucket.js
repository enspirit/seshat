'use strict';

const _ = require('lodash');
const express = require('express');
const fileUpload = require('./bucket/file-upload');
const fileRetrieve = require('./bucket/file-retrieve');
const fileList = require('./bucket/file-list');
const fileDelete = require('./bucket/file-delete');
const direntMiddleware = require('./bucket/dirent-mw');

const DEFAULTS = {
  uploadPage: true,
  lastModified: true,
  etag: true,
  cacheControl: 'public'
};

module.exports = (config) => {
  const router = express.Router();

  // Merge with defaults
  config = _.merge(DEFAULTS, config);

  if (config.middlewares) {
    const mw = config.middlewares ? [].concat(config.middlewares) : [];
    router.use(mw);
  }

  router.use(direntMiddleware(config));
  router.use('/', fileList(config));
  router.use('/', fileUpload(config));
  router.use('/', fileRetrieve(config));
  router.use('/', fileDelete(config));

  return router;
};
