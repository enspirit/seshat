export class SeshatError extends Error { }
export class ObjectNotFoundError extends SeshatError { }
export class PrefixNotFoundError extends SeshatError { }

export class BucketPolicyError extends SeshatError { }
export class AccessDeniedError extends BucketPolicyError { }

export class ObjectTransformerError extends SeshatError { }
