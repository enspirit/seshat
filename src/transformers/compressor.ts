import { createGzip } from 'node:zlib';

import { Readable } from 'stream';
import { ObjectMeta, ObjectTransformer, ObjectTransformerMode, ObjectTransformerOutput, ObjectTransformerType } from '../types';

export class ObjectCompressor implements ObjectTransformer {

  type: ObjectTransformerType = 'Ingress';

  async transform(stream: Readable, meta: ObjectMeta, _mode: ObjectTransformerMode): Promise<ObjectTransformerOutput> {
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
