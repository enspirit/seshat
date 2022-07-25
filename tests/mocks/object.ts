import * as path from 'path';
import * as fs from 'fs';
import { Object } from '../../src/types';

export const mockFileObject = {
  name: 'file.txt',
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
