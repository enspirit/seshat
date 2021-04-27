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
class UnsecurePathError extends ExtendableError {}
class FileAlreadyExistsError extends ExtendableError {}

export {
  ArgumentError,
  NotImplementedError,
  FileNotFoundError,
  PipelineClosedError,
  UnsecurePathError,
  FileAlreadyExistsError
};
