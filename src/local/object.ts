import { Readable } from 'stream';
import SeshatObject from '../object';

import * as path from 'path';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as mime from 'mime-types';

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

  static async fromPath(fpath: string) {
    const stats = await fsPromises.stat(fpath);
    return new LocalObject(fpath, stats);
  }
}
