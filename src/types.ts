import { Request } from 'express';
import { Readable } from 'stream';
import { EventEmitter } from 'events';

export interface Config {
  bucket: Bucket
  actions?: Action[]
}

export interface ObjectMeta {
  name: string
  contentType: string

  ctime?: Date
  mtime?: Date
  contentLength?: number

  [key: string]: any
}

export interface BucketConfig {
  policies?: Array<BucketPolicy>
  transformers?: Array<ObjectTransformer>
}

type BucketEventMap = Record<string, any>;
type BucketEventKey<T extends BucketEventMap> = string & keyof T;
type BucketEventReceiver<T> = (params: T) => void;
interface BucketEventEmitter<T extends BucketEventMap> {
  on<K extends BucketEventKey<T>>
    (eventName: K, fn: BucketEventReceiver<T[K]>): void;
  off<K extends BucketEventKey<T>>
    (eventName: K, fn: BucketEventReceiver<T[K]>): void;
  emit<K extends BucketEventKey<T>>
    (eventName: K, params: T[K]): void;
}

export declare interface Bucket {
  exists(path: string): Promise<boolean>;

  head(path: string): Promise<ObjectMeta>;
  get(path: string): Promise<Object>;
  put(stream: Readable, meta: ObjectMeta): Promise<Object>;
  delete(path: string): Promise<void>;
  list(prefix?: string): Promise<ObjectMeta[]>;

}

export interface BucketPolicy {
  head(path: string): Promise<void>
  get(path: string): Promise<void>
  put(meta: ObjectMeta): Promise<void>
  delete(path: string): Promise<void>
  list(prefix?: string): Promise<void>
}

export interface Object {
  meta: ObjectMeta
  body: Readable;
}

export interface ObjectTransformerOutput {
  stream: Readable
  meta: ObjectMeta
}

export type ObjectTransformerType = 'Ingress' | 'Egress' | 'Duplex';
export type ObjectTransformerMode = 'Ingress' | 'Egress';

export interface ObjectTransformer {

  type: ObjectTransformerType;

  transform(stream: Readable, meta: ObjectMeta, mode: ObjectTransformerMode): Promise<ObjectTransformerOutput>;

}

export interface Action {
  name: string;
  options: { [key: string]: any };

  run(request: Request): Promise<any>;
}

export type MiddlewareFactory = (config: Config, opts?: any) => any

declare global {
  namespace Express {
    interface Request {
      seshat: {
        bucket: Bucket
        object?: Object
      }
    }
  }
}
