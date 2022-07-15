import { Readable, Writable } from 'stream';
import SeshatObject from '../object';

import * as path from 'path';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as mime from 'mime-types';
import { SeshatError, ObjectNotFoundError, PrefixNotFoundError } from '../errors';

export default class LocalObject extends SeshatObject {

  path: string;
  name: string;
  isFile: boolean;
  isDirectory: boolean;
  atime: Date;
  ctime: Date;
  mtime: Date;
  contentType: string;
  contentLength: number;

  constructor(fpath: string, stats: fs.Stats) {
    super();

    this.path = fpath;
    this.name = path.basename(fpath);
    this.isFile = stats.isFile();
    this.isDirectory = stats.isDirectory();
    this.atime = stats.atime;
    this.ctime = stats.ctime;
    this.mtime = stats.mtime;
    this.contentType = stats.isDirectory()
      ? 'directory'
      : mime.lookup(fpath) || 'application/octet-stream';
    this.contentLength = stats.size;
  }

  getReadableStream(): Readable {
    if (!this.isFile) {
      throw new Error('Unable to get a stream, object is not a file');
    }
    return fs.createReadStream(this.path);
  }

  getWritableStream(): Writable {
    if (!this.isFile) {
      throw new Error('Unable to get a stream, object is not a file');
    }
    return fs.createWriteStream(this.path);
  }

  static async fromPath(fpath: string): Promise<LocalObject> {
    try {
      const stats = await fsPromises.stat(fpath);
      return new LocalObject(fpath, stats);
    } catch (err) {
      if (err.code === 'ENOENT') {
        throw new ObjectNotFoundError(`Object ${fpath} not found`);
      }
      throw new SeshatError(err.message);
    }
  }

  static async readdir(dirpath: string): Promise<LocalObject[]> {
    try {
      const objectPaths = await fsPromises.readdir(dirpath);
      return Promise.all(objectPaths.map(fpath => {
        return this.fromPath(path.join(dirpath, fpath));
      }));
    } catch (err) {
      if (err.code === 'ENOENT') {
        throw new PrefixNotFoundError(`Unable to find objects with prefix ${dirpath}`);
      }
      throw new SeshatError(err.message);
    }
  }

  static async delete(fpath: string): Promise<void> {
    const object = await this.fromPath(fpath);
    if (object.isDirectory) {
      throw new SeshatError('Path does not match single object.');
    }
    try {
      await fsPromises.unlink(fpath);
    } catch (err) {
      if (err.code === 'ENOENT') {
        throw new ObjectNotFoundError(`Object ${fpath} not found`);
      }
      throw new SeshatError(err.message);
    }
  }

  static async write(fpath: string, stream: Readable): Promise<LocalObject> {
    await fsPromises.writeFile(fpath, stream);
    return this.fromPath(fpath);
  }
}
