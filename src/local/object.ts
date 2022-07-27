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
      return await this.metaFromStats(fpath, fullpath, stats);
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

  static async metaFromStats(name: string, fpath: string, stats: fs.Stats): Promise<ObjectMeta> {
    const loadMeta = async () => {
      try {
        const meta = (await fs.promises.readFile(`${fpath}.seshat`)).toString();
        return JSON.parse(meta);
      } catch (err) {
        return {};
      }
    };

    const meta = await loadMeta();
    return {
      name: path.normalize(name),
      ctime: stats.ctime,
      mtime: stats.mtime,
      contentType: stats.isDirectory()
        ? 'directory'
        : mime.lookup(fpath) || 'application/octet-stream',
      contentLength: stats.size,
      ...meta,
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

  static async write(meta: ObjectMeta, stream: Readable, basePath?: string): Promise<LocalObject> {
    const fpath = meta.name;
    const fullpath = basePath ? path.join(basePath, fpath) : fpath;
    const metadataPath = `${fullpath}.seshat`;

    const writeFile = async () => {
      const fileStream = fs.createWriteStream(fullpath);
      stream.pipe(fileStream);
      await new Promise(resolve => fileStream.on('finish', resolve));
    };

    const writeMeta = async () => {
      const { name: _name, ...rest } = meta;

      return fs.promises.writeFile(metadataPath, JSON.stringify(rest));
    };

    await Promise.all([writeFile(), writeMeta()]);

    return this.fromPath(fpath, basePath);
  }
}
