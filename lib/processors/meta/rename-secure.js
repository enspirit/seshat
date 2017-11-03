'use strict';

const Promise = require('bluebird');
const crypto = require('crypto');
const mime = require('mime-types');
const randomBytes = Promise.promisify(crypto.randomBytes);

/**
  * This processor generates secure random filenames
  */
module.exports = (length = 16) => {
  return {
    process: (file) => {
      return randomBytes(length)
        .then((buf) => {
          let unique = buf
            .toString('base64')
            .replace(/\//g, '_')
            .replace(/\+/g, '-');

          let extension = file.mimetype ?
            mime.extension(file.mimetype) : 'bin';

          file.originalFilename = file.filename;
          file.filename = `${unique}.${extension}`;

          return Promise.resolve(file);
        });
    }
  };
};

