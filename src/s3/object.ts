import { Readable, Writable } from 'stream';
import { Object } from '../types';
import { S3Client, HeadObjectCommandOutput, GetObjectCommand } from '@aws-sdk/client-s3';

export default class S3Object implements Object {

  #s3client: S3Client;
  #bucket: string;

  constructor(
    s3client: S3Client,
    bucket: string,
    public name: string,
    public isFile: boolean,
    public isDirectory: boolean,
    public contentType: string,
    public contentLength: number,
    public ctime?: Date,
    public mtime?: Date,
  ) {
    this.#s3client = s3client;
    this.#bucket = bucket;
  }

  async getReadableStream(): Promise<Readable> {
    const object = await this.#s3client.send(new GetObjectCommand({
      Bucket: this.#bucket,
      Key: this.name,
    }));
    // casting due to https://transang.me/modern-fetch-and-how-to-get-buffer-output-from-aws-sdk-v3-getobjectcommand/
    return object.Body as Readable;
  }

  getWritableStream(): Promise<Writable> {
    throw new Error('Method not implemented.');
  }

  static fromHeadOutput(s3client: S3Client, bucket: string, name: string, output: HeadObjectCommandOutput) {
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
