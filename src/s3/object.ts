import { Readable, Writable } from 'stream';
import { SeshatObject } from '../types';
import { default as S3, HeadObjectOutput } from 'aws-sdk/clients/s3';

export default class S3Object implements SeshatObject {

  constructor(
    private s3client: S3,
    private bucket: string,
    public name: string,
    public isFile: boolean,
    public isDirectory: boolean,
    public contentType: string,
    public contentLength: number,
    public ctime?: Date,
    public mtime?: Date,
  ) {
  }

  getReadableStream(): Readable {
    return this.s3client.getObject({
      Bucket: this.bucket,
      Key: this.name,
    }).createReadStream();
  }

  getWritableStream(): Writable {
    throw new Error('Method not implemented.');
  }

  static fromHeadOutput(s3client: S3, bucket: string, name: string, output: HeadObjectOutput) {
    return new S3Object(
      s3client,
      bucket,
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
