'use strict';

const fs = require('fs');
const path = require('path');
const stream = require('stream');
const AbstractStorage = require('./abstract');
const {FileNotFoundError, ArgumentError} = require('../robust/errors');
const mkdirp = require('mkdirp-promise')
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

    filepath = path.normalize(filepath);
    if (filepath[0] === '/') {
      filepath = filepath.substr(1);
    }

    if (!this.isPathSecure(filepath)){
      return Promise.reject(new ArgumentError('unsecure path used'));
    }

    let subdir = path.dirname(filepath);
    filepath = path.join(this.path, filepath);
    let directory = path.dirname(filepath);

    return new Promise((resolve, reject) => {
      fs.exists(directory, (exists) => {
        if (!exists && !this.dynamicTree){
          return reject(new ArgumentError(
            `The subdirectory '${subdir}' does not exist`));
        }

        let p = Promise.resolve();
        if (!exists){
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
      let filepath = path.join(this.path, filename);
      fs.exists(filepath, (exists) => {
        if (exists) {
          let stream = fs.createReadStream(filepath);
          resolve(stream);
        } else {
          reject(new FileNotFoundError(
            `File ${filename} can't be found in storage`));
        }
      });
    });
  }

  // checks that the path is not outside of the bucket folder
  isPathSecure(filepath) {
    let dest = path.normalize(path.join(this.path, filepath));
    return dest.indexOf(this.path) === 0;
  }
}

module.exports = LocalStorage;
