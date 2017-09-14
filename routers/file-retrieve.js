'use strict';

const express = require('express');
const {FileNotFoundError} = require('../lib/robust/errors');
const mime = require('mime-types');

module.exports = (storage) => {
  const router = express.Router();

  router.get('/:filename', (req, res, next) => {
    storage.get(req.params.filename)
    .then((filestream) => {
      let mimeType = mime.lookup(req.params.filename);
      res.setHeader('Content-Type', mimeType);
      filestream.pipe(res);
    })
    .catch((err) => {
      if (err instanceof FileNotFoundError){
        res.sendStatus(404);
      } else {
        next(err);
      }
    });
  });

  return router;
};
