'use strict';

const Promise = require('bluebird');
const Busboy = require('busboy');
const logger = require('../../../lib/logger');

module.exports = (storage) => (req, res, next) => {
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