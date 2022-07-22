import { Readable } from 'stream';
import AbstractBucket from '../abstract-bucket';
import { SeshatObject, SeshatObjectMeta } from '../types';
import S3Object from './object';

import { S3Client, HeadObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

import { ObjectNotFoundError, PrefixNotFoundError } from '../errors';

export interface S3BucketOptions {
  bucket: string,
  s3client: S3Client,
  prefix?: string
}

export default class S3Bucket extends AbstractBucket {

  constructor(private options: S3BucketOptions) {
    super();
  }

  private get s3client() {
    return this.options.s3client;
  }

  private get bucket() {
    return this.options.bucket;
  }

  async _get(path: string): Promise<SeshatObject> {
    try {
      const object = await this.s3client.send(new HeadObjectCommand({
        Bucket: this.bucket,
        Key: this.objectKey(path),
      }));
      return S3Object.fromHeadOutput(this.s3client, this.bucket, path, object);
    } catch (err: any) {
      if (err.code === 'NotFound') {
        throw new ObjectNotFoundError(`Object ${path} not found`);
      }
      throw err;
    }
  }

  async _put(path: string, stream: Readable, meta: SeshatObjectMeta): Promise<SeshatObject> {
    const target = {
      Key: this.objectKey(path),
      Bucket: this.bucket,
      ContentType: meta.mimeType,
      Body: stream,
      Metadata: {
        ...meta,
      },
    };

    const upload = new Upload({
      client: this.s3client,
      queueSize: 4,
      params: target,
    });

    await upload.done();

    return this._get(path);
  }

  async _delete(path: string): Promise<void> {
    // ensure object exists before deleting it
    // in this, seshat differs from plain S3
    await this._get(path);
    await this.s3client.send(new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: this.objectKey(path),
    }));
  }

  async _list(prefix?: string | undefined): Promise<SeshatObject[]> {
    const res = await this.s3client.send(new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: this.objectKey(prefix),
      Delimiter: '/',
    }));
    console.log('with res=', res);
    if (!res.Contents || res.Contents?.length === 0) {
      throw new PrefixNotFoundError(`Unable to find objects with prefix ${prefix}`);
    }
    const promises = (res.Contents || []).map((object) => {
      return this._get(this.seshatKey(object.Key as string));
    });
    return Promise.all(promises);
  }

  /**
   * Given that an s3 bucket can be configured with a static prefix (see S3BucketOptions)
   * we want to ensure that all object Keys are taking into consideration that optional parameter.
   *
   * We therefore need helpers to include/remove this prefix from object Keys
   */

  private objectKey(path?: string): string {
    return (this.options.prefix || '') + (path || '');
  }

  private seshatKey(key: string): string {
    return key.substring((this.options.prefix || '').length);
  }

  /**
   * Given t
   */

}
