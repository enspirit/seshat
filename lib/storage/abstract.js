'use strict';

const {NotImplementedError} = require('../robust/errors');

class FileStorage {

  dirent(/* path */) {
    throw new NotImplementedError('FileStorage#dirent not implemented');
  }

  save(/*filestream, filename*/) {
    throw new NotImplementedError('FileStorage#save not implemented');
  }

  list(/* path */) {
    throw new NotImplementedError('FileStorage#list not implemented');
  }

  get(/*filename*/) {
    throw new NotImplementedError('FileStorage#get not implemented');
  }

  mkdir(/*path*/) {
    throw new NotImplementedError('FileStorage#mkdir not implemented');
  }

  delete(/*filename*/) {
    throw new NotImplementedError('FileStorage#delete not implemented');
  }

}

module.exports = FileStorage;
