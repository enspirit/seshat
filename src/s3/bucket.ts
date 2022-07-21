import { Readable } from 'stream';
import AbstractBucket from '../abstract-bucket';
import { SeshatObject, SeshatObjectMeta } from '../types';
import S3Object from './object';
import { default as S3 } from 'aws-sdk/clients/s3';
import { ObjectNotFoundError, PrefixNotFoundError } from '../errors';

export interface S3BucketOptions {
  bucket: string,
  s3client: S3,
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
      const object = await this.s3client.headObject({
        Bucket: this.bucket,
        Key: this.objectKey(path),
      }).promise();

      return S3Object.fromHeadOutput(this.s3client, this.bucket, path, object);
    } catch (err: any) {
      if (err.code === 'NotFound') {
        throw new ObjectNotFoundError(`Object ${path} not found`);
      }
      throw err;
    }
  }

  async _put(path: string, stream: Readable, meta: SeshatObjectMeta): Promise<SeshatObject> {
    await this.s3client.upload({
      Key: this.objectKey(path),
      Bucket: this.bucket,
      ContentType: meta.mimeType,
      Body: stream,
      Metadata: {
        ...meta,
      },
    }).promise();
    return this._get(path);
  }

  async _delete(path: string): Promise<void> {
    // ensure object exists before deleting it
    // in this, seshat differs from plain S3
    await this._get(path);
    await this.s3client.deleteObject({
      Bucket: this.bucket,
      Key: this.objectKey(path),
    }).promise();
  }

  async _list(prefix?: string | undefined): Promise<SeshatObject[]> {
    const res = await this.s3client.listObjectsV2({
      Bucket: this.bucket,
      Prefix: this.objectKey(prefix),
      Delimiter: '/',
    }).promise();
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
