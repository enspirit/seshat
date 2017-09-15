'use strict';

const path = require('path');
const express = require('express');
const fileUpload = require('./bucket/file-upload');
const fileRetrieve = require('./bucket/file-retrieve');

module.exports = (config) => {
  const router = express.Router();

  router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, './bucket/index.html'));
  });

  router.use('/', fileUpload(config));
  router.use('/', fileRetrieve(config));

  return router;
};
