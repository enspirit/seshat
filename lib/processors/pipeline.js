'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const {PipelineClosedError} = require('../robust/errors');
const {EventEmitter} = require('events');
//

class Pipeline extends EventEmitter {

  constructor(typology) {
    super();
    this.typology = typology;
    this.closed = false;
    this.failed = false;

    this.processes = [];
  }

  process(file) {
    if (this.closed) {
      return Promise.reject(new PipelineClosedError(
        'The pipeline has been closed'));
    }

    let promise = Promise.reduce(this.typology.processors, (file, proc) => {
      return proc.process(file);
    }, file);

    promise = promise.catch((err) => {
      this.failed = true;
      this.emit('error', err);
    });
    this.processes.push(promise);

    return promise;
  }

  close() {
    this.closed = true;

    Promise.all(this.processes)
    .then((res) => {
      if (!this.failed){
        this.emit('success', res);
      }
      this.emit('finished', res);
    });
  }

}

module.exports = Pipeline;
