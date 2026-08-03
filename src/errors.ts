export class SeshatError extends Error {
  httpCode: number = 500;

  constructor(msg: string, public rootCause?: Error) {
    super(msg);
  }
}

export class NotImplementedError extends SeshatError {
  httpCode = 500;
}

export class ObjectNotFoundError extends SeshatError {
  httpCode = 404;
}
export class PrefixNotFoundError extends SeshatError {
  httpCode = 404;
}

export class BucketPolicyError extends SeshatError {
  httpCode = 400;
}
export class AccessDeniedError extends BucketPolicyError {
  httpCode = 400;
}

export class NoObjectMatchingError extends BucketPolicyError {
  httpCode = 400;
}

export class ObjectTransformerError extends SeshatError {
}

export class VirusDetectedError extends ObjectTransformerError {
  httpCode = 400;
}

export class UnknownActionError extends SeshatError {}

/**
 * 501 rather than 4xx on purpose: every case that raises this - a backend with
 * no signing authority, a bucket carrying content transformers, an SSE-C
 * bucket - is a fact about how the server is configured, not a mistake the
 * client made or can correct by asking differently.
 */
export class PresignNotSupportedError extends SeshatError {
  httpCode = 501;
}
