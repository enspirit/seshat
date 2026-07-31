import { Readable } from 'stream';
import type { SeshatObject, SeshatObjectMeta } from '../types.js';
import { type HeadObjectCommandOutput, type GetObjectCommandOutput } from '@aws-sdk/client-s3';

export class S3ObjectMeta implements SeshatObjectMeta {
  #bucket;

  constructor(
    bucket: string,
    public name: string,
    public contentType: string,
    public ctime?: Date | undefined,
    public mtime?: Date | undefined,
    public etag?: string | undefined,
    public contentLength?: number | undefined,
  ) {
    this.#bucket = bucket;
  }
}

export class S3Object implements SeshatObject {

  meta: S3ObjectMeta;
  body: Readable;

  constructor(
    meta: S3ObjectMeta,
    body: Readable,
  ) {
    this.meta = meta;
    this.body = body;
  }

  static metaFromCommandOutput(bucket: string, name: string, output: HeadObjectCommandOutput | GetObjectCommandOutput): S3ObjectMeta {
    const meta = new S3ObjectMeta(
      bucket,
      name,
      output.ContentType || 'application/octet-stream',
      output.LastModified,
      output.LastModified,
      output.ETag,
      output.ContentLength || 0,
    );

    if (!output.Metadata) {
      return meta;
    }
    return Object.entries(output.Metadata)
      .reduce((meta: SeshatObjectMeta, [key, value]: [string, string]): SeshatObjectMeta => {
        meta[key] = decodeURIComponent(value);
        return meta;
      }, meta) as S3ObjectMeta;
  }

  static fromGetObjectCommandOutput(bucket: string, name: string, output: GetObjectCommandOutput) {
    const meta = this.metaFromCommandOutput(bucket, name, output);
    return new S3Object(meta, output.Body as Readable);
  }

}
