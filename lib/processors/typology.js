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

  getPipeline(req) {
    const processors = this.processors
      .filter(p => p.condCb(req))
      .map((p) => p.processor);
    return new Pipeline(processors);
  }

  /**
   * Adds a processor to the typology.
   * If a function is passed as first argument it will be
   * called for each request, passing it in arguments.
   * The function must return a boolean specifying whether or not
   * the processor must be executed
   * @param {fn} condCb: (optional) condition callback.
   * @param {Processor} processor
   */
  add(condCb, processor) {
    if (!processor) {
      processor = condCb;
      condCb = () => true;
    }
    this.processors.push({ processor, condCb });
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
