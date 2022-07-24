import * as path from 'path';
import * as fs from 'fs';
import { Object } from '../../src/types';

export const mockFileObject = {
  name: 'file.txt',
  isFile: true,
  isDirectory: false,
  ctime: new Date(),
  mtime: new Date(),
  contentLength: 22,
  contentType: 'plain/text',
  async getReadableStream() {
    return fs.createReadStream(path.join(__dirname, '../../package.json'));
  },
  async getWritableStream() {
    throw new Error('not implemented');
  },
} as Object;

export const mockFolderObject = {
  name: 'folder',
  isFile: false,
  isDirectory: true,
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
} as Object;
