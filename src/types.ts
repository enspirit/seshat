import { Request } from 'express';
import { Readable, Writable } from 'stream';

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
}

export interface BucketConfig {
  policies?: Array<BucketPolicy>
  transformers?: Array<ObjectTransformer>
}

export interface Bucket {
  exists(path: string): Promise<boolean>;

  get(path: string): Promise<Object>;
  put(stream: Readable, meta: ObjectMeta): Promise<Object>;
  delete(path: string): Promise<void>;
  list(prefix?: string): Promise<Object[]>;
}

export interface BucketPolicy {
  get(path: string): Promise<void>
  put(meta: ObjectMeta): Promise<void>
  delete(path: string): Promise<void>
  list(prefix?: string): Promise<void>
}

export interface Object {
  meta: ObjectMeta
  getReadableStream(): Promise<Readable>
  getWritableStream(): Promise<Writable>
}

export interface ObjectTransformerOutput {
  stream: Readable
  meta: ObjectMeta
}

export type ObjectTransformerType = 'Ingress' | 'Egress' | 'Duplex';

export interface ObjectTransformer {

  type: ObjectTransformerType;

  transform(stream: Readable, meta: ObjectMeta): Promise<ObjectTransformerOutput>;

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
