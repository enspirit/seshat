'use strict';

//
const Debug = require('./meta/debug');
const DevNull = require('./meta/devnull');
const LocalStorage = require('./storage/local');
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

  static localStorage(config) {
    return new LocalStorage(config);
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
