'use strict';

const Promise = require('bluebird');
const express = require('express');
const Busboy = require('busboy');
const logger = require('../lib/logger');
const mime = require('mime-types');

let multiPartHandler = (storage) => (req, res, next) => {
  let contentType = req.headers['content-type'] || '';
  if (contentType.indexOf('multipart/form-data') < 0){
    return next();
  }

  let busboy = new Busboy({ headers: req.headers });

  var paths = [];
  let promises = [];

  busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
    logger.info('File [' + fieldname + ']: filename: ' + filename + ', encoding: ' + encoding + ', mimetype: ' + mimetype);
    let p = storage
      .save(file, filename)
      .then((path) => paths.push(path));
    promises.push(p);
  });

  busboy.on('finish', () => {
    Promise.all(promises)
    .then(() => {
      req.files = paths;
      next();
    })
    .catch((err) => {
      logger.error("Error while streaming file(s) to storage", err);
      //next(err);
      res.sendStatus(500);
    });
  });

  req.pipe(busboy);
};

let defaultHandler = (storage) => (req, res, next) => {
  if (req.files && req.files.length){
    return next();
  }

  let disposition = req.headers['content-disposition'];
  let filename;
  if (disposition && disposition.indexOf('attachment') !== -1) {
    var filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
    var matches = filenameRegex.exec(disposition);
    if (matches && matches[1]) {
      filename = matches[1].replace(/['"]/g, '');
    }
  }

  if (!filename){
    filename = 'frombody.' + mime.extension(req.headers['content-type']);
  }

  storage.save(req, filename)
  .then(() => {
    req.files = [filename];
    next();
  });
};

module.exports = (storage) => {

  const router = express.Router();

  let handlers = [
    multiPartHandler(storage),
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
