'use strict';

const Promise = require('bluebird');
const express = require('express');
const multipartHandler = require('./mime-handlers/multipart-form-data');
const defaultHandler = require('./mime-handlers/default');

let initPipeline = (typology) => (req, res, next) => {
  req.pipeline = typology.getPipeline();
  next();
};

module.exports = ({typology, path, ...config}) => {

  const router = express.Router();

  let handlers = [
    initPipeline(typology),
    multipartHandler,
    defaultHandler
  ];

  //
  router.post('/', handlers, (req, res) => {
    req.pipeline.on('finished', (files) => {
      res.location(path + files[0].filename);
      res.sendStatus(204);
    });

    req.pipeline.close();
  });

  return router;
};
