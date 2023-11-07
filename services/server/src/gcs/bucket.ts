import { Readable } from 'stream';
import AbstractBucket from '../abstract-bucket';
import { BucketConfig, ListOptions, Object, ObjectMeta } from '../types';
import { GCSObject, GCSObjectMeta } from './object';
import { GetFilesOptions, Storage } from '@google-cloud/storage';

import { NotImplementedError, ObjectNotFoundError } from '@enspirit/seshat-commons';

export interface GCSBucketConfig extends BucketConfig {
  bucket: string,
  client: Storage,
  prefix?: string
}

export class GCSBucket extends AbstractBucket {

  private client: Storage;
  private bucket: string;
  private prefix?: string;

  constructor(
    config: GCSBucketConfig,
  ) {
    super(config);
    this.client = config.client;
    this.bucket = config.bucket;
    this.prefix = config.prefix;

    if (config.encryption) {
      throw new NotImplementedError('No support for encryption on GCS bucket');
    }
  }

  async _head(path: string): Promise<ObjectMeta> {
    const file = this.client
      .bucket(this.bucket)
      .file(this.objectKey(path));

    return GCSObjectMeta.fromFile(file, this.prefix);
  }

  async _get(path: string): Promise<Object> {
    const file = this.client
      .bucket(this.bucket)
      .file(this.objectKey(path));

    return GCSObject.fromFile(file, this.prefix);
  }

  async _put(stream: Readable, meta: ObjectMeta): Promise<ObjectMeta> {
    const { name } = meta;
    const file = this.client
      .bucket(this.bucket)
      .file(this.objectKey(name));

    const writable = file.createWriteStream({ resumable: false });

    await new Promise((resolve, reject) => {
      writable.on('finish', resolve);
      writable.on('error', reject);
      stream.pipe(writable);
    });

    const nonStandardMeta = Object.entries(meta)
      .reduce((meta, [key, value]) => {
        if (!['name', 'contentType', 'ctime', 'mtime', 'contentLength', 'etag'].includes(key)) {
          meta[key] = value;
        }
        return meta;
      }, {} as {[key: string]: any});

    if (Object.keys(nonStandardMeta).length > 0) {
      await file.setMetadata({
        metadata: meta,
      });
    }

    return this._head(name);
  }

  async _delete(path: string): Promise<void> {
    const file = this.client
      .bucket(this.bucket)
      .file(this.objectKey(path));

    const [exists] = await file.exists();
    if (!exists) {
      throw new ObjectNotFoundError(`Object ${file.name} not found`);
    }

    await file.delete();
  }

  async _list(prefix?: string | undefined, options?: ListOptions): Promise<ObjectMeta[]> {

    const params: GetFilesOptions = {
      prefix: this.objectKey(prefix),
      delimiter: '/',
      autoPaginate: false,
    };

    if (options && options.recursive === true) {
      delete params.delimiter;
    }

    const [files, _, apiResponse] = await this.client
      .bucket(this.bucket)
      .getFiles(params);

    let objects = await Promise.all(files.map(f => GCSObjectMeta.fromFile(f, this.prefix)));
    // Remove folder/prefix from its own list
    objects = objects.filter(o => o.name !== prefix && o.contentLength !== 0);

    const prefixes = (apiResponse.prefixes || []).map((p: string) => {
      return {
        name: this.seshatKey(p),
        contentType: 'seshat/prefix',
      };
    });

    // Since we can be prefixed, we hide the prefix from
    // the object names
    return [...objects, ...prefixes];
  }

  async _mkdir(prefix: string): Promise<void> {
    await this.client.bucket(this.bucket)
      .file(prefix)
      .save('', { resumable: false });
  }

  /**
   * Given that a GCS bucket can be configured with a static prefix (see FCSBucketOptions)
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
