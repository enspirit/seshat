import { Request } from 'express';
import { Readable, Writable } from 'stream';

export interface SeshatConfig {
  bucket: SeshatBucket
  actions?: SeshatAction[]
  middlewares?: SeshatMiddlewareFactory[]
}

export interface SeshatObjectMeta {
  mimeType: string
}

export interface SeshatBucket {
  exists(path: string): Promise<boolean>;
  fileExists(path: string): Promise<boolean>;
  dirExists(path: string): Promise<boolean>;

  get(path: string): Promise<SeshatObject>;
  put(path: string, stream: Readable, meta: SeshatObjectMeta): Promise<SeshatObject>;
  delete(path: string): Promise<void>;
  list(prefix?: string): Promise<SeshatObject[]>;
}

export interface SeshatBucketPolicy {
  get(path: string): Promise<void>
  put(path: string, meta: SeshatObjectMeta): Promise<void>
  delete(path: string): Promise<void>
  list(prefix?: string): Promise<void>
}

export interface SeshatObject {
  name: string
  isFile: boolean
  isDirectory: boolean
  ctime: Date
  mtime: Date
  contentType: string
  contentLength: number

  getReadableStream(): Readable
  getWritableStream(): Writable
}

export interface SeshatAction {
  name: string;
  options: { [key: string]: any };

  run(request: Request): Promise<any>;
}

export type SeshatMiddlewareFactory = (config: SeshatConfig, opts?: any) => any

declare global {
  namespace Express {
    interface Request {
      seshat: {
        bucket: SeshatBucket
        object?: SeshatObject
      }
    }
  }
}
