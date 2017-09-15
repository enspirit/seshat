'use strict';

const fs = require('fs');
const path = require('path');
const AbstractStorage = require('./abstract');
const {FileNotFoundError} = require('../../robust/errors');
const Promise = require('bluebird');

class LocalStorage extends AbstractStorage {

  constructor(path) {
    super();
    this.path = path;
  }

  save(filestream, filename) {
    return new Promise((resolve, reject) => {
      let stream = fs.createWriteStream(path.join(this.path, filename));
      stream.on('error', (err) => reject(err));
      stream.on('finish', () => resolve(filename));

      filestream.pipe(stream);
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

}

module.exports = LocalStorage;
