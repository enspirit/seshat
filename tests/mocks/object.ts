import { Readable } from 'stream';
import type { Object } from '../../src/types.js';

const MOCK_CONTENT = 'This is mock content!!';

export const getMockFileObject = (): Object => {
  return {
    meta: {
      name: 'tmp/file.txt',
      ctime: new Date(),
      mtime: new Date(),
      contentLength: Buffer.byteLength(MOCK_CONTENT),
      contentType: 'plain/text',
    },
    body: Readable.from(MOCK_CONTENT),
  } as Object;
};

