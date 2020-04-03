'use strict';

const mime = require('mime-types');
const Promise = require('bluebird');
const fs = require('fs');
const flstat = Promise.promisify(fs.lstat);
const freaddir = Promise.promisify(fs.readdir);
const path = require('path');
const logger = require('../logger');
const stream = require('stream');
const AbstractStorage = require('./abstract');
const { FileNotFoundError, ArgumentError, UnsecurePathError }
  = require('../robust/errors');
const mkdirp = require('mkdirp-promise');

class LocalStorage extends AbstractStorage {

  constructor({path, dynamicTree = false}) {
    super();
    this.path = path;
    this.dynamicTree = dynamicTree;
  }

  dirent(subpath) {
    subpath = path.join(this.path, subpath);

    if (!this.isPathSecure(subpath)) {
      return Promise.reject(
        new UnsecurePathError('Relative paths not allowed'));
    }

    return flstat(subpath).then((dirent) => {
      return dirent;
    });
  }

  list(subpath='') {
    subpath = path.join(this.path, subpath);

    if (!this.isPathSecure(subpath)) {
      return Promise.reject(
        new UnsecurePathError('Relative paths not allowed'));
    }

    return freaddir(subpath, { withFileTypes: true })
      .then((entries) => {
        return entries.map((entry) => {
          const dirent = {
            name: entry.name,
            isDirectory: entry.isDirectory(),
            type : entry.isDirectory() ? 'directory' : mime.lookup(entry.name)
          };
          return dirent;
        });
      });
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
    const itemPath = this.itemPath(filename);
    return new Promise((resolve, reject) => {
      fs.exists(itemPath, (exists) => {
        if (exists) {
          let stream = fs.createReadStream(itemPath);
          resolve(stream);
        } else {
          reject(new FileNotFoundError(
            `File ${filename} not found in storage`));
        }
      });
    });
  }

  // returns a full path of a bucket item
  itemPath(itempath) {
    const fpath = path.join(this.path, itempath);

    if (!this.isPathSecure(fpath)) {
      return Promise.reject(
        new UnsecurePathError('Relative paths not allowed'));
    }
    return fpath;
  }

  // checks that the path is not outside of the bucket folder
  isPathSecure(filepath) {
    let dest = path.normalize(filepath);
    return dest.indexOf(this.path) === 0;
  }
}

module.exports = LocalStorage;
