'use strict';

const express = require('express');
const multipartHandler = require('./mime-handlers/multipart-form-data');
const defaultHandler = require('./mime-handlers/default');
const logger = require('../../lib/logger');
const { FileNotFoundError } = require('../../lib/robust/errors');

let initPipeline = (typology, path) => (req, res, next) => {
  req.pipeline = typology.getPipeline(req);

  req.pipeline.on('error', (err) => {
    if (err instanceof FileNotFoundError) {
      return res.sendStatus(404);
    }
    next(err);
  });

  req.pipeline.on('success', (files) => {
    let file = files[0];
    let location = file.filename;
    if (file.path !== '/'){
      location = file.path + '/' + encodeURIComponent(file.filename);
    }
    if (file.originalFilename){
      location = location + '?n=' + encodeURIComponent(file.originalFilename);
    }

    location = (path + location).replace(/\/\/+/g, '/');
    logger.debug('Location set to `' + location + '`');
    res.location(location);
    res.sendStatus(204);
  });

  next();
};

module.exports = ({typology, path}) => {
  const router = express.Router();

  let handlers = [
    initPipeline(typology, path),
    multipartHandler,
    defaultHandler
  ];

  //
  router.post(/^(.*)$/, handlers, (req) => {
    req.pipeline.close();
  });

  return router;
};
