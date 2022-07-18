import { Readable, Writable } from 'stream';

export interface SeshatConfig {
  bucket: SeshatBucket
}

export interface SeshatBucket {
  exists(path: string): Promise<boolean>;
  fileExists(path: string): Promise<boolean>;
  dirExists(path: string): Promise<boolean>;

  get(path: string): Promise<SeshatObject>;
  put(path: string, stream: Readable): Promise<SeshatObject>;
  delete(path: string): Promise<void>;
  list(prefix?: string): Promise<SeshatObject[]>;
}

export interface SeshatObject {
  name: string
  isFile: boolean
  isDirectory: boolean
  atime: Date
  ctime: Date
  mtime: Date
  contentType: string
  contentLength: number

  getReadableStream(): Readable
  getWritableStream(): Writable
}

declare global {
  namespace Express {
    interface Request {
    }
  }
}
