'use strict';

const {NotImplementedError} = require('../robust/errors');

class AbstractProcessor {

  process(/*file*/) {
    throw new NotImplementedError('AbstractProcessor#process not implemented');
  }

}

module.exports = AbstractProcessor;
