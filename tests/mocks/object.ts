import { Readable } from 'stream';
import type { Object } from '../../src/types.js';

// The body must stay exactly as long as the contentLength advertised below:
// node's http parser rejects responses whose body overruns Content-Length.
const BODY = 'seshat mock file body\n';

export const getMockFileObject = (): Object => {
  return {
    meta: {
      name: 'tmp/file.txt',
      ctime: new Date(),
      mtime: new Date(),
      contentLength: Buffer.byteLength(BODY),
      contentType: 'plain/text',
    },
    body: Readable.from([BODY]),
  } as Object;
};
