'use strict';

const express = require('express');
const {FileNotFoundError} = require('../../lib/robust/errors');
const mime = require('mime-types');
const path = require('path');

module.exports = ({storage, ...config}) => {
  const router = express.Router();

  router.delete(/^(.*)$/, (req, res, next) => {
    if (req.dirent.isDirectory()) {
      return next(new Error(`DELETE on folders not supported`));
    }
    storage.delete(req.dirent.name)
    .then(() => {
      return res.sendStatus(204)
    });
  });

  return router;
};
