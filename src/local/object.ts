import { Readable, Writable } from 'stream';
import { SeshatObject } from '../types';

import * as path from 'path';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as mime from 'mime-types';
import { SeshatError, ObjectNotFoundError, PrefixNotFoundError } from '../errors';

export default class LocalObject implements SeshatObject {

  #path: string;

  name: string;
  isFile: boolean;
  isDirectory: boolean;
  ctime: Date;
  mtime: Date;
  contentType: string;
  contentLength: number;

  constructor(name: string, fpath: string, stats: fs.Stats) {
    this.name = path.normalize(name);
    this.#path = fpath;
    this.isFile = stats.isFile();
    this.isDirectory = stats.isDirectory();
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
    return fs.createReadStream(this.#path);
  }

  getWritableStream(): Writable {
    if (!this.isFile) {
      throw new Error('Unable to get a stream, object is not a file');
    }
    return fs.createWriteStream(this.#path);
  }

  static async fromPath(fpath: string, basePath?: string): Promise<LocalObject> {
    try {
      const fullpath = basePath ? path.join(basePath, fpath) : fpath;
      const stats = await fsPromises.stat(fullpath);
      return new LocalObject(fpath, fullpath, stats);
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        throw new ObjectNotFoundError(`Object ${fpath} not found`);
      }
      throw new SeshatError(err.message);
    }
  }

  static async readdir(dirpath: string, basePath?: string): Promise<LocalObject[]> {
    try {
      const fullpath = basePath ? path.join(basePath, dirpath) : dirpath;
      const objectPaths = await fsPromises.readdir(fullpath);
      return Promise.all(objectPaths.map(fpath => {
        return this.fromPath(path.join(dirpath, fpath), basePath);
      }));
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        throw new PrefixNotFoundError(`Unable to find objects with prefix ${dirpath}`);
      }
      throw new SeshatError(err.message);
    }
  }

  static async delete(fpath: string, basePath?: string): Promise<void> {
    const object = await this.fromPath(fpath, basePath);
    if (object.isDirectory) {
      throw new SeshatError('Path does not match single object.');
    }
    try {
      await fsPromises.unlink(fpath);
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        throw new ObjectNotFoundError(`Object ${fpath} not found`);
      }
      throw new SeshatError(err.message);
    }
  }

  static async write(fpath: string, stream: Readable, basePath?: string): Promise<LocalObject> {
    const fullpath = basePath ? path.join(basePath, fpath) : fpath;
    const fileStream = fs.createWriteStream(fullpath);
    stream.pipe(fileStream);
    await new Promise(resolve => fileStream.on('finish', resolve));
    return this.fromPath(fpath, basePath);
  }
}
