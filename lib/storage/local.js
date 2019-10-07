'use strict';

const fs = require('fs');
const path = require('path');
const logger = require('../logger');
const stream = require('stream');
const AbstractStorage = require('./abstract');
const {
  FileNotFoundError,
  ArgumentError,
  UnsecurePathError
} = require('../robust/errors');
const mkdirp = require('mkdirp-promise');
const Promise = require('bluebird');

class LocalStorage extends AbstractStorage {

  constructor({path, dynamicTree = false}) {
    super();
    this.path = path;
    this.dynamicTree = dynamicTree;
  }

  save(filestream, filepath) {
    if (!(filestream instanceof stream)) {
      return Promise.reject(new TypeError(
        `ReadableStream expected, got '${typeof filestream}'`));
    }

    if (!filepath) {
      return Promise.reject(new ArgumentError('filepath must be provided'));
    }

    filepath = path.join(this.path, filepath);

    if (!this.isPathSecure(filepath)) {
      return Promise.reject(
        new UnsecurePathError('Relative paths not allowed'));
    }

    logger.debug(`LocalStorage.save with '${filepath}'`);

    return new Promise((resolve, reject) => {
      let directory = path.dirname(filepath);
      fs.exists(directory, (exists) => {
        if (!exists && !this.dynamicTree) {
          return reject(new FileNotFoundError(
            `The subdirectory '${directory}' does not exist`));
        }

        let p = Promise.resolve();
        if (!exists) {
          p = mkdirp(directory);
        }

        p.then(() => {
          let stream = fs.createWriteStream(filepath);
          stream.on('error', (err) => reject(err));
          stream.on('close', () => resolve(filepath));

          filestream.pipe(stream);
        });
      });
    });
  }

  get(filename) {
    return new Promise((resolve, reject) => {
      let filepath = path.join(this.path, decodeURIComponent(filename));
      fs.exists(filepath, (exists) => {
        if (exists) {
          let stream = fs.createReadStream(filepath);
          resolve(stream);
        } else {
          reject(new FileNotFoundError(
            `File ${filename} not found in storage`));
        }
      });
    });
  }

  // checks that the path is not outside of the bucket folder
  isPathSecure(filepath) {
    let dest = path.normalize(filepath);
    return dest.indexOf(this.path) === 0;
  }
}

module.exports = LocalStorage;
