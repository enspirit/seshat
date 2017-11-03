'use strict';

const Promise = require('bluebird');
const Busboy = require('busboy');
const logger = require('../../../lib/logger');

module.exports = (req, res, next) => {
  let contentType = req.headers['content-type'] || '';
  if (contentType.indexOf('multipart/form-data') < 0){
    return next();
  }

  let busboy = new Busboy({ headers: req.headers });

  let promises = [];

  busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
    logger.info('File [' + fieldname + ']: filename: ' + filename + ', encoding: ' + encoding + ', mimetype: ' + mimetype);
    let p = req.pipeline.process({
      filename: filename,
      path: req.path,
      encoding: encoding,
      mimetype: mimetype,
      stream: file
    });
    promises.push(p);
  });

  busboy.on('finish', () => {
    Promise.all(promises)
      .then(() => next())
      .catch((err) => {
        logger.error('Error in the pipeline', err);
        next(err);
      });
  });

  req.pipe(busboy);
};