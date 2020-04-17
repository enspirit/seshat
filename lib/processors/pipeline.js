'use strict';

const Promise = require('bluebird');
const {PipelineClosedError} = require('../robust/errors');
const {EventEmitter} = require('events');
//

class Pipeline extends EventEmitter {

  constructor(processors) {
    super();
    this.processors = processors;
    this.closed = false;
    this.failed = false;

    this.processes = [];
  }

  process(file, args) {
    if (this.closed) {
      return Promise.reject(new PipelineClosedError(
        'The pipeline has been closed'));
    }

    let promise = Promise.reduce(this.processors, (file, proc) => {
      return proc.process(file, args);
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
        if (!this.failed) {
          this.emit('success', res);
        }
        this.emit('finished', res);
      });
  }

}

module.exports = Pipeline;
