import { Readable } from 'stream';
import { ListOptions, Object, ObjectMeta } from '../types';

import * as path from 'path';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as mime from 'mime-types';
import { SeshatError, ObjectNotFoundError, PrefixNotFoundError } from '@enspirit/seshat-commons';
import { readdir } from './utils';

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

  static async metaFromDir(fpath: string, _basePath?: string): Promise<ObjectMeta> {
    return {
      name: `${path.normalize(fpath)}/`,
      contentType: 'seshat/prefix',
    };
  }

  static async metaFromStats(name: string, fpath: string, stats: fs.Stats): Promise<ObjectMeta> {
    const loadMeta = async () => {
      try {
        const json = (await fs.promises.readFile(`${fpath}.seshat`)).toString();
        const meta = JSON.parse(json);
        return {
          ...meta,
          ctime: meta.ctime ? new Date(meta.ctime) : undefined,
          mtime: meta.mtime ? new Date(meta.mtime) : undefined,
        };
      } catch (err) {
        return {};
      }
    };

    const meta = await loadMeta();

    return {
      name: path.normalize(name),
      contentLength: stats.size,
      contentType: stats.isDirectory()
        ? 'directory'
        : mime.lookup(fpath) || 'application/octet-stream',
      ...meta,
      ctime: new Date(stats.ctime || meta.ctime),
      mtime: new Date(stats.mtime || meta.mtime),
    };
  }

  static async fromPath(fpath: string, basePath?: string): Promise<LocalObject> {
    const meta = await this.metaFromPath(fpath, basePath);
    const fullpath = basePath ? path.join(basePath, fpath) : fpath;
    return new LocalObject(meta, fs.createReadStream(fullpath));
  }

  static async readdir(dirpath: string, basePath?: string, options?: ListOptions): Promise<ObjectMeta[]> {
    try {
      const fullpath = basePath ? path.join(basePath, dirpath) : dirpath;
      const objectPaths = await readdir(fullpath, options?.recursive);
      const promises = objectPaths
        .filter(dirent => options?.recursive === true ? dirent.isFile() : true)
        .map(entry => {
          return entry.isDirectory()
            ? this.metaFromDir(path.join(dirpath, entry.name), basePath)
            : this.metaFromPath(path.join(dirpath, entry.name), basePath);
        });
      const objects = await Promise.all(promises);
      return objects
        .filter(o => {
          return o.name.indexOf('.seshat') <= 0;
        });
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        throw new PrefixNotFoundError(`Unable to find objects with prefix ${dirpath}`);
      }
      throw new SeshatError(err.message);
    }
  }

  static async delete(fpath: string, basePath?: string): Promise<void> {
    const fullpath = basePath ? path.join(basePath, fpath) : fpath;
    await this.metaFromPath(fpath, basePath);
    try {
      // Delete the file
      await fsPromises.unlink(fullpath);
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        throw new ObjectNotFoundError(`Object ${fpath} not found`);
      }
      throw new SeshatError(err.message);
    }

    // Ensure metadata file is deleted as well
    try {
      await fsPromises.unlink(`${fullpath}.seshat`);
    } catch (err: any) {
      if (err.code !== 'ENOENT') {
        throw new SeshatError(err.message);
      }
    }
  }

  static async mkdir(prefix: string, basePath?: string): Promise<void> {
    const fullpath = basePath ? path.join(basePath, prefix) : prefix;
    fs.promises.mkdir(fullpath, { recursive: true });
  }

  static async write(meta: ObjectMeta, stream: Readable, basePath?: string): Promise<ObjectMeta> {
    const fpath = meta.name;
    const fullpath = basePath ? path.join(basePath, fpath) : fpath;
    const metadataPath = `${fullpath}.seshat`;

    const ensureFolder = async () => {
      return fs.promises.mkdir(path.dirname(fullpath), { recursive: true });
    };

    const writeFile = async () => {
      const fileStream = fs.createWriteStream(fullpath);
      await new Promise((resolve, reject) => {
        fileStream.on('finish', resolve);
        fileStream.on('error', reject);
        stream.on('error', reject);
        stream.pipe(fileStream);
      });
    };

    const writeMeta = async () => {
      const { name: _name, ...rest } = meta;

      return fs.promises.writeFile(metadataPath, JSON.stringify(rest));
    };

    await ensureFolder();
    await Promise.all([writeFile(), writeMeta()]);

    const object = await this.fromPath(fpath, basePath);
    return object.meta;
  }
}
