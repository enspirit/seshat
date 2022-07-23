export class SeshatError extends Error { }
export class ObjectNotFoundError extends SeshatError { }
export class PrefixNotFoundError extends SeshatError { }

export class SeshatBucketPolicyError extends SeshatError { }
export class AccessDeniedError extends SeshatBucketPolicyError { }

