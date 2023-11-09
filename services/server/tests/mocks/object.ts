import * as path from 'path';
import * as fs from 'fs';
import { Object } from '../../src/types';

export const getMockFileObject = (): Object => {
  return {
    meta: {
      name: 'tmp/file.txt',
      ctime: new Date(),
      mtime: new Date(),
      contentLength: 22,
      contentType: 'plain/text',
    },
    body: fs.createReadStream(path.join(__dirname, '../../package.json')),
  } as Object;
};

