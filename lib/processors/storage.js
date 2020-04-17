'use strict';

const AbstractProcessor = require('./abstract');

class StorageProcessor extends AbstractProcessor {

  constructor(storage) {
    super();
    this.storage = storage;
  }

  process(file, args) {
    var filepath = (file.path + '/' + file.filename).replace(/\/\/+/g, '/');
    return this.storage.save(file.stream, filepath, args.force)
      .then(() => file);
  }

}

module.exports = StorageProcessor;
