import { Readable, Writable } from 'stream';
import { SeshatObject } from '../types';
import { HeadObjectOutput } from 'aws-sdk/clients/s3';

export default class S3Object implements SeshatObject {

  constructor(
    public name: string,
    public isFile: boolean,
    public isDirectory: boolean,
    public contentType: string,
    public contentLength: number,
    public ctime?: Date,
    public mtime?: Date,
  )
  {
  }

  getReadableStream(): Readable {
    throw new Error('Method not implemented.');
  }

  getWritableStream(): Writable {
    throw new Error('Method not implemented.');
  }

  static fromHeadOutput(name: string, output: HeadObjectOutput) {
    return new S3Object(
      name,
      true,
      false,
      output.ContentType || 'application/octet-stream',
      output.ContentLength || 0,
      output.LastModified,
      output.LastModified,
    );
  }

}
