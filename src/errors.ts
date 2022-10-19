export class SeshatError extends Error {
  httpCode: number = 500;
  constructor(message: string) {
    super(message);
  }
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
