import * as path from 'path';
import AbstractBucket from '../bucket';
import LocalObject from './object';

export default class LocalBucket extends AbstractBucket {
  constructor(private path: string) {
    super();
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
    return LocalObject.fromPath(this.pathTo(path));
  }

  async list(prefix: string = './') {
    const dirpath = this.pathTo(prefix);
    return LocalObject.readdir(dirpath);
  }

  private pathTo(fpath: string): string {
    const filepath = path.join(this.path, fpath);
    return this.ensureSecure(filepath);
  }

  // checks that the path is not outside of the bucket folder
  private ensureSecure(filepath) {
    if (!this.isPathSecure(filepath)) {
      throw new Error('Relative paths are not allowed');
    }
    return filepath;
  }

  private isPathSecure(filepath) {
    const dest = path.normalize(filepath);
    return dest.indexOf(this.path) === 0;
  }

}
