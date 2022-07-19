import * as path from 'path';
import LocalObject from './object';
import { Readable } from 'stream';
import { SeshatBucket } from '../types';

export default class LocalBucket implements SeshatBucket {

  constructor(private path: string) {
  }

  async exists(path: string) {
    try {
      await this.get(path);
      return true;
    } catch (err) {
      return false;
    }
  }

  async fileExists(path: string) {
    try {
      const object = await this.get(path);
      return object.isFile;
    } catch (err) {
      return false;
    }
  }

  async dirExists(path: string) {
    try {
      const object = await this.get(path);
      return object.isDirectory;
    } catch (err) {
      return false;
    }
  }

  async get(path: string) {
    this.ensureSecure(path);
    return LocalObject.fromPath(path, this.path);
  }

  async put(path: string, stream: Readable) {
    this.ensureSecure(path);
    return await LocalObject.write(path, stream, this.path);
  }

  async list(prefix: string = '') {
    this.ensureSecure(prefix);
    return LocalObject.readdir(prefix, this.path);
  }

  async delete(path: string) {
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
