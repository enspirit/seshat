import { createGzip } from 'node:zlib';

import { Readable } from 'stream';
import { SeshatObjectMeta, SeshatObjectTransformer, SeshatObjectTransformerOutput } from '../types';

export default class SeshatObjectCompressor implements SeshatObjectTransformer {

  async transform(stream: Readable, meta: SeshatObjectMeta): Promise<SeshatObjectTransformerOutput> {
    const gzip = createGzip();
    const newMeta = {
      ...meta,
      mimeType: 'application/gzip',
      name: `${meta.name}.gz`,
    };
    stream.pipe(gzip);
    return { meta: newMeta, stream: gzip };
  }

}
