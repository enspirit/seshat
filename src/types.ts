import AbstractBucket from './bucket';

export interface SeshatStats {
  name: string
  isFile: boolean
  isDirectory: boolean
  atime: Date
  ctime: Date
  mtime: Date
  contentType: string
  contentLength: number
}

export interface SeshatConfig {
  bucket: AbstractBucket
}

export interface SeshatRequest {
  filename: string,
  path: string,
  bucket: AbstractBucket
}

export { AbstractBucket };
