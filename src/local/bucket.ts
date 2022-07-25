import * as path from 'path';
import { LocalObject } from './object';
import { Readable } from 'stream';
import AbstractBucket from '../abstract-bucket';
import { ObjectMeta } from '../types';

export class LocalBucket extends AbstractBucket {

  constructor(private path: string) {
    super();
  }

  async _get(path: string) {
    this.ensureSecure(path);
    return LocalObject.fromPath(path, this.path);
  }

  async _put(stream: Readable, meta: ObjectMeta) {
    this.ensureSecure(meta.name);
    return await LocalObject.write(meta.name, stream, this.path);
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
