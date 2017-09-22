'use strict';

const AbstractProcessor = require('./abstract');

class StorageProcessor extends AbstractProcessor {

  constructor(storage) {
    super();
    this.storage = storage;
  }

  process(file) {
    return this.storage.save(file.stream, file.filename)
      .then(() => file);
  }

}

module.exports = StorageProcessor;
