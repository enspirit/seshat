import mime from 'mime-types';
import Promise from 'bluebird';
import fs from 'fs';
import path from 'path';
import logger from '../logger';
import stream from 'stream';
import AbstractStorage from './abstract';
import {
  FileNotFoundError,
  FileAlreadyExistsError,
  ArgumentError,
  UnsecurePathError
} from '../robust/errors';
import mkdirp from 'mkdirp';

const flstat = Promise.promisify(fs.lstat);
const freaddir = Promise.promisify(fs.readdir);
const fsunlink = Promise.promisify(fs.unlink);

const fsexists = (fpath) => {
  return new Promise((resolve) => {
    fs.exists(fpath, (exists) => {
      resolve(exists);
    });
  });
};

export default class LocalStorage extends AbstractStorage {

  constructor({ path, dynamicTree = false }) {
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

  delete(path) {
    const itemPath = this.itemPath(path);
    return fsunlink(itemPath);
  }

  list(subpath = '') {
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

  save(filestream, filepath, force = false) {
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
      const directory = path.dirname(filepath);
      fsexists(directory)
        .then((exists) => {
          if (!exists && !this.dynamicTree) {
            throw new FileNotFoundError(`The subdirectory '${directory}' does not exist`);
          }
          if (!exists) {
            return mkdirp(directory);
          }
        })
        .then(() => fsexists(filepath))
        .then((exists) => {
          if (exists && !force) {
            throw new FileAlreadyExistsError(filepath);
          }
          const stream = fs.createWriteStream(filepath);
          stream.on('error', (err) => reject(err));
          stream.on('close', () => resolve(filepath));

          filestream.pipe(stream);
        })
        .catch(reject);
    });
  }

  get(filename) {
    const itemPath = this.itemPath(filename);
    return new Promise((resolve, reject) => {
      fs.exists(itemPath, (exists) => {
        if (exists) {
          const stream = fs.createReadStream(itemPath);
          resolve(stream);
        } else {
          reject(new FileNotFoundError(
            `File ${filename} not found in storage`));
        }
      });
    });
  }

  mkdir(path) {
    const itemPath = this.itemPath(path);
    return mkdirp(itemPath);
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
    const dest = path.normalize(filepath);
    return dest.indexOf(this.path) === 0;
  }
}

