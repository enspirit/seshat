'use strict';

const Promise = require('bluebird');
const express = require('express');
const multipartHandler = require('./mime-handlers/multipart-form-data');
const defaultHandler = require('./mime-handlers/default');
const {FileNotFoundError, UnsecurePathError}
  = require('../../lib/robust/errors');


let initPipeline = (typology, path) => (req, res, next) => {
  req.pipeline = typology.getPipeline();

  req.pipeline.on('error', (err) => {
    res.header('Content-Type', 'text/html');

    if (err instanceof FileNotFoundError) {
      res.status(404);
    } else if (err instanceof UnsecurePathError) {
      res.status(400);
    } else {
      res.status(500);
    }

    res.send();
  });

  req.pipeline.on('success', (files) => {
    let file = files[0];
    let location = file.filename;
    if (file.path !== '/'){
      location = file.path + '/' + file.filename;
    }
    if (file.originalFilename){
      location = location + '?n=' + file.originalFilename;
    }

    location = (path + location).replace('//', '/');
    res.location(location);
    res.sendStatus(204);
  });

  next();
};

module.exports = ({typology, path, ...config}) => {

  const router = express.Router();

  let handlers = [
    initPipeline(typology, path),
    multipartHandler,
    defaultHandler
  ];

  //
  router.post(/^(.*)$/, handlers, (req, res) => {
    req.pipeline.close();
  });

  return router;
};
