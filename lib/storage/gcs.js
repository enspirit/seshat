'use strict';

const AbstractStorage = require('./abstract');
const { Storage } = require('@google-cloud/storage');

const dirent = (metadata, source='') => {
  return {
    name: metadata.name.substr(source.length),
    isDirectory: () => metadata.name[metadata.name.length-1] === '/',
    isFile: () => metadata.name[metadata.name.length-1] != '/'
  };
};

class GcsStorage extends AbstractStorage {

  constructor({ bucket, dynamicTree }) {
    super();
    this.storage = new Storage();
    this.dynamicTree = dynamicTree;
    this.bucket = this.storage.bucket(bucket);
  }

  dirent(subpath) {
    if (subpath[0] === '/') {
      subpath = subpath.substr(1);
    }
    if (!subpath) {
      return Promise.resolve(dirent({ name: '/' }))
    }
    return this.bucket
      .file(subpath)
      .getMetadata()
      .then((meta) => dirent(meta[0]))
  }

  delete(path) {

  }

  list(subpath) {
    if (subpath[0] === '/') {
      subpath = subpath.substr(1);
    }
    return this.bucket
      .getFiles({
        autoPaginate: false,
        delimiter: '/',
        prefix: subpath
      })
      .then((res) => {
        const files = (res[0] || []).map(f => dirent(f, subpath));
        const apiResponse = res[2];
        const subpaths = (apiResponse.prefixes || []).map((p) => {
          return dirent({ name: p }, subpath);
        });
        return [...files, ...subpaths];
      });
  }

  save(filestream, filepath, force=false) {

  }

  get(subpath) {
    if (subpath[0] === '/') {
      subpath = subpath.substr(1);
    }

    return this.bucket.file(subpath)
      .get()
      .then(f => console.log(f) && f);
  }

  mkdir(path) {

  }

}

module.exports = GcsStorage;
