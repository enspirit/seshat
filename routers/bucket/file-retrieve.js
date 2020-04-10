'use strict';

const express = require('express');
const {FileNotFoundError} = require('../../lib/robust/errors');
const mime = require('mime-types');
const path = require('path');

module.exports = ({storage, ...config}) => {
  const router = express.Router();

  router.get(/^(.*)$/, (req, res, next) => {
    if (!req.dirent.isFile()) {
      return next();
    }
    storage.get(req.dirent.name)
    .then((filestream) => {
      let mimeType = mime.lookup(req.dirent.name);
      res.setHeader('Content-Type', mimeType);
      if (req.query.n) {
        let filename = encodeURIComponent(req.query.n);
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      }
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
