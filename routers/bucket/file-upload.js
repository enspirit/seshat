'use strict';

const express = require('express');
const multipartHandler = require('./mime-handlers/multipart-form-data');
const defaultHandler = require('./mime-handlers/default');

module.exports = (storage) => {

  const router = express.Router();

  let handlers = [
    multipartHandler(storage),
    defaultHandler(storage)
  ];

  router.post('/', handlers, (req, res) => {
    let reqUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    if (reqUrl[reqUrl.length - 1] != '/'){
      reqUrl += '/';
    }

    if (req.files && req.files.length){
      res.location(reqUrl + req.files[0]);
    }
    res.sendStatus(204);
  });

  return router;
};
