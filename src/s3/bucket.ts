import { Readable } from 'stream';
import AbstractBucket from '../abstract-bucket';
import { BucketConfig, Object, ObjectMeta } from '../types';
import { S3Object } from './object';

import { S3Client, HeadObjectCommand, ListObjectsV2Command, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

import { ObjectNotFoundError, PrefixNotFoundError } from '../errors';

export interface S3BucketConfig extends BucketConfig {
  bucket: string,
  s3client: S3Client,
  prefix?: string
}

export class S3Bucket extends AbstractBucket {

  private s3client: S3Client;
  private bucket: string;
  private prefix?: string;

  constructor(
    config: S3BucketConfig,
  ) {
    super(config);
    this.s3client = config.s3client;
    this.bucket = config.bucket;
    this.prefix = config.prefix;
  }

  async _head(path: string): Promise<ObjectMeta> {
    try {
      const headOutput = await this.s3client.send(new HeadObjectCommand({
        Bucket: this.bucket,
        Key: this.objectKey(path),
      }));
      return S3Object.metaFromCommandOutput(this.bucket, path, headOutput);
    } catch (err: any) {
      if (['NotFound', 'NoSuchKey'].includes(err.name)) {
        throw new ObjectNotFoundError(`Object ${path} not found`);
      }
      throw err;
    }
  }

  async _get(path: string): Promise<Object> {
    try {
      const object = await this.s3client.send(new GetObjectCommand({
        Bucket: this.bucket,
        Key: this.objectKey(path),
      }));
      return S3Object.fromGetObjectCommandOutput(this.bucket, path, object);
    } catch (err: any) {
      if (['NotFound', 'NoSuchKey'].includes(err.name)) {
        throw new ObjectNotFoundError(`Object ${path} not found`);
      }
      throw err;
    }
  }

  async _put(stream: Readable, meta: ObjectMeta): Promise<ObjectMeta> {
    // Some of the metadata can be stored in standard s3 properties
    const { contentType, name, ...rest } = meta;
    const metadata = Object.entries(rest)
      .reduce((obj, [key, value]) => {
        obj[key] = value.toString ? value.toString() : value;
        return obj;
      }, {} as {[key: string]: string});

    const target = {
      Key: this.objectKey(name),
      Bucket: this.bucket,
      ContentType: contentType,
      Body: stream,
      Metadata: {
        ...metadata,
      },
    };

    const upload = new Upload({
      client: this.s3client,
      queueSize: 4,
      params: target,
    });

    await upload.done();

    return this._head(meta.name);
  }

  async _delete(path: string): Promise<void> {
    // ensure object exists before deleting it
    // in this, seshat differs from plain S3
    await this._head(path);
    await this.s3client.send(new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: this.objectKey(path),
    }));
  }

  async _list(prefix?: string | undefined): Promise<ObjectMeta[]> {
    const res = await this.s3client.send(new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: this.objectKey(prefix),
      Delimiter: '/',
    }));

    // Prefixes
    const prefixes = (res.CommonPrefixes || []).map((entry) => {
      return {
        name: entry.Prefix as string,
        contentType: 'seshat/prefix',
      };
    });

    // Objects
    const promises = (res.Contents || []).map((object) => {
      return this._head(this.seshatKey(object.Key as string));
    });
    const objects = await Promise.all(promises);

    // Combine both prefixes & objects
    const results = [...objects, ...prefixes];
    if (!results.length) {
      throw new PrefixNotFoundError(`Unable to find objects with prefix ${prefix}`);
    }

    // Sorted by name
    return results.sort((a,b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));
  }

  async _mkdir(prefix: string): Promise<void> {

    let folderName = this.objectKey(prefix);
    // ensure we have a trailing slash
    if (folderName[folderName.length - 1] !== '/') {
      folderName = `${folderName}/`;
    }

    const target = {
      Key: folderName,
      Bucket: this.bucket,
      Body: '',
    };

    const upload = new Upload({
      client: this.s3client,
      queueSize: 1,
      params: target,
    });

    await upload.done();
  }

  /**
   * Given that an s3 bucket can be configured with a static prefix (see S3BucketOptions)
   * we want to ensure that all object Keys are taking into consideration that optional parameter.
   *
   * We therefore need helpers to include/remove this prefix from object Keys
   */

  private objectKey(path?: string): string {
    return (this.prefix || '') + (path || '');
  }

  private seshatKey(key: string): string {
    return key.substring((this.prefix || '').length);
  }
}
