'use strict';

const express = require('express');
const {FileNotFoundError} = require('../../lib/robust/errors');
const mime = require('mime-types');
const path = require('path');

module.exports = ({storage, ...config}) => {
  const router = express.Router();

  router.get(/^(.*)$/, (req, res, next) => {
    storage.get(req.path)
    .then((filestream) => {
      let mimeType = mime.lookup(req.path);
      let filename = req.query.n || path.basename(req.path);
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
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
