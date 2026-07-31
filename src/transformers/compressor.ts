import { createGzip } from 'node:zlib';

import { Readable } from 'stream';
import { type SeshatObjectMeta, type ObjectTransformer, type ObjectTransformerMode, type ObjectTransformerOutput, type ObjectTransformerType } from '../types.js';

export class ObjectCompressor implements ObjectTransformer {

  type: ObjectTransformerType = 'Ingress';

  async transform(stream: Readable, meta: SeshatObjectMeta, _mode: ObjectTransformerMode): Promise<ObjectTransformerOutput> {
    const gzip = createGzip();
    const newMeta = {
      ...meta,
      contentType: 'application/gzip',
      name: `${meta.name}.gz`,
    };
    stream.pipe(gzip);
    return { meta: newMeta, stream: gzip };
  }

}
