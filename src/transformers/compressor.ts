import { createGzip } from 'node:zlib';

import { Readable } from 'stream';
import { ObjectMeta, ObjectTransformer, ObjectTransformerOutput } from '../types';

export default class ObjectCompressor implements ObjectTransformer {

  async transform(stream: Readable, meta: ObjectMeta): Promise<ObjectTransformerOutput> {
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
