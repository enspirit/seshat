'use strict';

//
const Debug = require('./meta/debug');
const DevNull = require('./meta/devnull');
const StorageProcesor = require('./storage');
const RenameSecure = require('./meta/rename-secure');
const Pipeline = require('./pipeline');

class Typology {

  constructor() {
    this.processors = [];
  }

  getPipeline() {
    return new Pipeline(this);
  }

  add(processor) {
    this.processors.push(processor);
    return this;
  }

  static storage(storage) {
    return new StorageProcesor(storage);
  }

  static debug(config) {
    return Debug(config);
  }

  static renameSecure(config) {
    return RenameSecure(config);
  }

  static devnull() {
    return DevNull();
  }

}

module.exports = Typology;
