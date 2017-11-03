'use strict';

class ExtendableError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = (new Error(message)).stack;
    }
  }
}

class ArgumentError extends ExtendableError {}
class NotImplementedError extends ExtendableError {}
class FileNotFoundError extends ExtendableError {}
class PipelineClosedError extends ExtendableError {}

module.exports = {
  ArgumentError: ArgumentError,
  NotImplementedError: NotImplementedError,
  FileNotFoundError: FileNotFoundError,
  PipelineClosedError: PipelineClosedError
};
