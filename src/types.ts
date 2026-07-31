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
