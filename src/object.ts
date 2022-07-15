import { SeshatStats } from './types';
import { Readable, Writable } from 'stream';

export default abstract class SeshatObject implements SeshatStats {
  abstract name: string
  abstract isFile: boolean
  abstract isDirectory: boolean
  abstract atime: Date
  abstract ctime: Date
  abstract mtime: Date
  abstract contentType: string
  abstract contentLength: number

  abstract getReadableStream(): Readable
  abstract getWritableStream(): Writable
}
