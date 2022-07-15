import * as path from 'path';
import * as fs from 'fs';
import SeshatObject from '../../src/object';

export const mockFileObject = {
  name: 'file.txt',
  isFile: true,
  isDirectory: false,
  atime: new Date(),
  ctime: new Date(),
  mtime: new Date(),
  contentLength: 22,
  contentType: 'plain/text',
  getReadableStream() {
    return fs.createReadStream(path.join(__dirname, '../../package.json'));
  },
  getWritableStream() {
    throw new Error('not implemented');
  },
} as SeshatObject;

export const mockFolderObject = {
  name: 'folder',
  isFile: false,
  isDirectory: true,
  atime: new Date(),
  ctime: new Date(),
  mtime: new Date(),
  contentLength: 22,
  contentType: 'folder',
  getReadableStream() {
    throw new Error('cannot get readable stream on folder');
  },
  getWritableStream() {
    throw new Error('cannot get writable stream on folder');
  },
} as SeshatObject;
