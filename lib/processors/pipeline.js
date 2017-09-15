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

    this.processes = [];
  }

  process(file) {
    if (this.closed) {
      return Promise.reject(new PipelineClosedError(
        'The pipeline has been closed'));
    }

    let promise = _.reduce(this.typology.processors, (previous, next) => {
      return previous.then(next.process.bind(next));
    }, Promise.resolve(file));

    this.processes.push(promise);

    return promise;
  }

  close() {
    this.closed = true;

    Promise.all(this.processes)
    .then((res) => this.emit('finished', res))
    .catch((err) => this.emit('error', err));
  }

}

module.exports = Pipeline;
