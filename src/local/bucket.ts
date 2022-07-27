import * as path from 'path';
import { LocalObject } from './object';
import { Readable } from 'stream';
import AbstractBucket from '../abstract-bucket';
import { BucketConfig, ObjectMeta } from '../types';

export interface LocalBucketConfig extends BucketConfig {
  path: string
}

export class LocalBucket extends AbstractBucket {

  private path: string;

  constructor(
    config: LocalBucketConfig,
  ) {
    super(config);
    this.path = config.path;
    if (process.env.NODE_ENV === 'production') {
      throw new Error('LocalBucket is not supposed to be used in production environments.');
    }
  }

  async _head(path: string) {
    this.ensureSecure(path);
    return await LocalObject.metaFromPath(path, this.path);
  }

  async _get(path: string) {
    this.ensureSecure(path);
    return LocalObject.fromPath(path, this.path);
  }

  async _put(stream: Readable, meta: ObjectMeta) {
    this.ensureSecure(meta.name);
    return await LocalObject.write(meta, stream, this.path);
  }

  async _list(prefix: string = '') {
    this.ensureSecure(prefix);
    return LocalObject.readdir(prefix, this.path);
  }

  async _delete(path: string) {
    this.ensureSecure(path);
    return LocalObject.delete(path, this.path);
  }

  // checks that the path is not outside of the bucket folder
  private ensureSecure(filepath: string) {
    const fullpath = path.join(this.path, filepath);
    if (!this.isPathSecure(fullpath)) {
      throw new Error('Relative paths are not allowed');
    }
    return filepath;
  }

  private isPathSecure(filepath: string) {
    const dest = path.normalize(filepath);
    return dest.indexOf(this.path) === 0;
  }

}
