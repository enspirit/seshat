'use strict';

const Promise = require('bluebird');
const express = require('express');
const multipartHandler = require('./mime-handlers/multipart-form-data');
const defaultHandler = require('./mime-handlers/default');

let initPipeline = (typology, path) => (req, res, next) => {
  req.pipeline = typology.getPipeline();

  req.pipeline.on('error', (error) => {
    res
      .header('Content-Type', 'text/plain')
      .status(500)
      .send(error.message);
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
