import { type NextFunction, type Request, type Response, Router } from 'express';
import { Readable } from 'stream';
import { Logger } from 'winston';

export type RouterFactory = (bucket: Bucket) => Router;

export interface Config {
  bucket: Bucket
  routers?: RouterFactory[],
  logger?: Logger
}

export interface SeshatObjectMeta {
  name: string
  contentType: string

  ctime?: Date
  mtime?: Date
  contentLength?: number
  etag?: string

  [key: string]: any
}

export interface BucketEncryption {
  alg: 'AES256',
  key: string
}

export interface BucketConfig {
  policies?: Array<BucketPolicy>
  transformers?: Array<ObjectTransformer>
  encryption?: BucketEncryption
}

export type BucketEvent = {
  stored: (meta: SeshatObjectMeta) => void,
  deleted: (path: string) => void,
};

export interface BucketEmitter {
  // matches EventEmitter.on
  on<U extends keyof BucketEvent>(event: U, listener: BucketEvent[U]): this;

  // matches EventEmitter.off
  off<U extends keyof BucketEvent>(event: U, listener: BucketEvent[U]): this;

  // matches EventEmitter.emit
  emit<U extends keyof BucketEvent>(
      event: U,
      ...args: Parameters<BucketEvent[U]>
  ): boolean;
}

export type ListOptions = {
  recursive?: boolean
}

export interface Bucket extends BucketEmitter {
  exists(path: string): Promise<boolean>;

  head(path: string): Promise<SeshatObjectMeta>;
  get(path: string): Promise<SeshatObject>;
  put(stream: Readable, meta: SeshatObjectMeta): Promise<SeshatObjectMeta>;
  delete(path: string): Promise<void>;
  list(prefix?: string, options?: ListOptions): Promise<SeshatObjectMeta[]>;
  mkdir(prefix: string): Promise<void>;
  presignUpload(request: PresignedUploadRequest): Promise<PresignedUpload>;
}

export interface BucketPolicy {
  head(path: string): Promise<void>
  get(path: string): Promise<void>
  put(meta: SeshatObjectMeta): Promise<void>
  delete(path: string): Promise<void>
  list(prefix?: string): Promise<void>
  mkdir(prefix: string): Promise<void>
}

export interface SeshatObject {
  meta: SeshatObjectMeta
  body: Readable;
}

export interface ObjectTransformerOutput {
  stream: Readable
  meta: SeshatObjectMeta
}

export type ObjectTransformerType = 'Ingress' | 'Egress' | 'Duplex';
export type ObjectTransformerMode = 'Ingress' | 'Egress';

export interface ObjectTransformer {

  type: ObjectTransformerType;

  transform(stream: Readable, meta: SeshatObjectMeta, mode: ObjectTransformerMode): Promise<ObjectTransformerOutput>;

}

/**
 * Implemented by transformers that only rewrite metadata and never touch the
 * bytes. Presence of `transformMeta` is itself the declaration - there is no
 * companion boolean that could drift out of sync with the behaviour.
 *
 * This matters for presigned uploads, where the bytes never reach Seshat: a
 * transformer that rewrites content cannot run, so presigning refuses rather
 * than silently dropping it. A transformer that does not implement this is
 * therefore assumed to touch content, which is the safe default for anything
 * written before this interface existed.
 */
export interface ObjectMetaTransformer {
  transformMeta(meta: SeshatObjectMeta, mode: ObjectTransformerMode): Promise<SeshatObjectMeta>;
}

export const isMetaTransformer = (
  transformer: ObjectTransformer,
): transformer is ObjectTransformer & ObjectMetaTransformer => {
  return typeof (transformer as Partial<ObjectMetaTransformer>).transformMeta === 'function';
};

/**
 * Applied when a caller reaches `Bucket.presignUpload` directly without naming
 * a lifetime. Requests arriving through the presign-upload action carry one
 * already, defaulted and bounded by that action's own options.
 */
export const DefaultPresignExpiresIn = 900;

export type PresignedUploadRequest = {
  /** Object name, relative to the bucket and to its static prefix, if any. */
  name: string
  contentType: string
  /** Bound into the signature: the upload must match it exactly. */
  contentLength: number
  /**
   * Seconds. Defaulted and bounded by the presign-upload action; omitted here,
   * it falls back to `DefaultPresignExpiresIn`.
   */
  expiresIn?: number
  /**
   * Extra metadata entries, stored as backend custom metadata. Entries never
   * override `name`, `contentType` or `contentLength`.
   */
  metadata?: Record<string, string>
}

export type PresignedUpload = {
  /** Treat as a bearer credential: whoever holds it can write this one object. */
  url: string
  method: 'PUT'
  /**
   * Headers the client must send verbatim. These are part of the signature, so
   * omitting or altering one makes the backend reject the upload. Anything the
   * backend carries in the URL itself is deliberately not repeated here.
   */
  headers: Record<string, string>
  /** Final object name, after name transformers such as SecureRename. */
  name: string
  expiresAt: Date
}

export interface Action {
  name: string;

  run(request: Request, response?: Response, next?: NextFunction): Promise<any>;
}

export type MiddlewareFactory = (config: Config, opts?: any) => any

declare global {
  namespace Express {
    interface Request {
      seshat: {
        logger: Logger
        bucket: Bucket
        object?: SeshatObject
      }
    }
  }
}
