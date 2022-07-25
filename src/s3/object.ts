import { Readable, Writable } from 'stream';
import { Object, ObjectMeta } from '../types';
import { S3Client, HeadObjectCommandOutput, GetObjectCommand } from '@aws-sdk/client-s3';

export class S3Object implements Object {

  #s3client: S3Client;
  #bucket: string;
  meta: ObjectMeta;

  constructor(
    s3client: S3Client,
    bucket: string,
    name: string,
    contentType: string,
    contentLength: number,
    ctime?: Date,
    mtime?: Date,
  ) {
    this.#s3client = s3client;
    this.#bucket = bucket;
    this.meta = {
      name,
      contentType,
      contentLength,
      ctime,
      mtime,
    };
  }

  async getReadableStream(): Promise<Readable> {
    const object = await this.#s3client.send(new GetObjectCommand({
      Bucket: this.#bucket,
      Key: this.meta.name,
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
      output.ContentType || 'application/octet-stream',
      output.ContentLength || 0,
      output.LastModified,
      output.LastModified,
    );
  }

}
