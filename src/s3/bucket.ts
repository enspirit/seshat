import { Readable } from 'stream';
import AbstractBucket from '../abstract-bucket';
import { SeshatObject, SeshatObjectMeta } from '../types';
import S3Object from './object';
import { default as S3 } from 'aws-sdk/clients/s3';
import { ObjectNotFoundError, PrefixNotFoundError } from '../errors';

export default class S3Bucket extends AbstractBucket {

  constructor(private bucketName: string, private s3client: S3) {
    super();
  }

  async _get(path: string): Promise<SeshatObject> {
    try {
      const object = await this.s3client.headObject({
        Bucket: this.bucketName,
        Key: path,
      }).promise();

      return S3Object.fromHeadOutput(path, object);
    } catch (err: any) {
      if (err.code === 'NotFound') {
        throw new ObjectNotFoundError(`Object ${path} not found`);
      }
      throw err;
    }
  }

  async _put(path: string, stream: Readable, meta: SeshatObjectMeta): Promise<SeshatObject> {
    await this.s3client.putObject({
      Key: path,
      Bucket: this.bucketName,
      ContentType: meta.mimeType,
      Body: stream,
      Metadata: {
        ...meta,
      },
    }).promise();
    return this._get(path);
  }

  _delete(path: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async _list(prefix?: string | undefined): Promise<SeshatObject[]> {
    const res = await this.s3client.listObjectsV2({
      Bucket: this.bucketName,
      Prefix: prefix,
      Delimiter: '/',
    }).promise();

    if (!res.Contents || res.Contents?.length === 0) {
      throw new PrefixNotFoundError(`Unable to find objects with prefix ${prefix}`);
    }
    const promises = (res.Contents || []).map((object) => this._get(object.Key as string));
    return Promise.all(promises);
  }

}
