'use strict';

const AbstractProcessor = require('./abstract');
const logger = require('../logger');

class StorageProcessor extends AbstractProcessor {

  constructor(storage) {
    super();
    this.storage = storage;
  }

  process(file) {
    var filepath = (file.path + '/' + file.filename).replace(/\/\/+/g, '/');
    return this.storage.save(file.stream, filepath)
      .then(() => file);
  }

}

module.exports = StorageProcessor;
