import { Readable } from 'stream';
import { Object, ObjectMeta } from '../types';

import * as path from 'path';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as mime from 'mime-types';
import { SeshatError, ObjectNotFoundError, PrefixNotFoundError } from '../errors';

export class LocalObject implements Object {

  meta: ObjectMeta;
  body: Readable;

  constructor(meta: ObjectMeta, body: Readable) {
    this.meta = meta;
    this.body = body;
  }

  static async metaFromPath(fpath: string, basePath?: string): Promise<ObjectMeta> {
    try {
      const fullpath = basePath ? path.join(basePath, fpath) : fpath;
      const stats = await fsPromises.stat(fullpath);
      if (stats.isDirectory()) {
        throw new ObjectNotFoundError(`Object ${fpath} not found`);
      }
      return this.metaFromStats(fpath, fullpath, stats);
    } catch (err: any) {
      if (err instanceof SeshatError) {
        throw err;
      }
      if (err.code === 'ENOENT') {
        throw new ObjectNotFoundError(`Object ${fpath} not found`);
      }
      throw new SeshatError(err.message);
    }
  }

  static metaFromStats(name: string, fpath: string, stats: fs.Stats): ObjectMeta {
    return {
      name: path.normalize(name),
      ctime: stats.ctime,
      mtime: stats.mtime,
      contentType: stats.isDirectory()
        ? 'directory'
        : mime.lookup(fpath) || 'application/octet-stream',
      contentLength: stats.size,
    };
  }

  static async fromPath(fpath: string, basePath?: string): Promise<LocalObject> {
    const meta = await this.metaFromPath(fpath, basePath);
    const fullpath = basePath ? path.join(basePath, fpath) : fpath;
    return new LocalObject(meta, fs.createReadStream(fullpath));
  }

  static async readdir(dirpath: string, basePath?: string): Promise<ObjectMeta[]> {
    try {
      const fullpath = basePath ? path.join(basePath, dirpath) : dirpath;
      const objectPaths = await fsPromises.readdir(fullpath, { withFileTypes: true });
      const promises = objectPaths
        .filter((entry) => {
          return !entry.isDirectory();
        })
        .map(entry => {
          return this.metaFromPath(path.join(dirpath, entry.name), basePath);
        });
      return Promise.all(promises);
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        throw new PrefixNotFoundError(`Unable to find objects with prefix ${dirpath}`);
      }
      throw new SeshatError(err.message);
    }
  }

  static async delete(fpath: string, basePath?: string): Promise<void> {
    await this.fromPath(fpath, basePath);
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
