'use strict';

const AbstractProcessor = require('../abstract');
const {NotImplementedError} = require('../../robust/errors');

class FileStorage extends AbstractProcessor {

  process(file) {
    return this.save(file.stream, file.filename)
      .then(() => file);
  }

  save(/*filestream, filename*/) {
    throw new NotImplementedError('FileStorage#save not implemented');
  }

  get(/*filename*/) {
    throw new NotImplementedError('FileStorage#get not implemented');
  }

  delete(/*filename*/) {
    throw new NotImplementedError('FileStorage#delete not implemented');
  }

}

module.exports = FileStorage;
