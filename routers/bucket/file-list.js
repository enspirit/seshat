'use strict';

const express = require('express');
const {FileNotFoundError} = require('../../lib/robust/errors');
const mime = require('mime-types');
const path = require('path');

module.exports = ({storage, ...config}) => {
  const router = express.Router();

  router.get(/^(.*)$/, (req, res, next) => {
    if (!req.dirent.isDirectory()) {
      return next();
    }
    res.format({
      json: () => {
        storage.list(req.dirent.name)
          .then((list) => res.send(list));
      },
      html: () => {
        if (config.uploadPage) {
          return res.sendFile(path.join(__dirname, './index.html'));
        }
        return res.status(404).send('Not found');
      },
      default: () => {
        return res.status(406).send('Format not supported');
      }
    })
  });

  return router;
};
