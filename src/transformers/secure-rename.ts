import crypto from 'crypto';
import { Readable } from 'stream';
import { ObjectMeta, ObjectTransformer, ObjectTransformerMode, ObjectTransformerOutput, ObjectTransformerType } from '../types';

const uniqueName = (length = 16): Promise<string> => {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(length, (err: any, buf: Buffer) => {
      if (err) {
        return reject(err);
      }
      const unique = buf
        .toString('base64')
        .replace(/\//g, '_')
        .replace(/\+/g, '-');
      resolve(unique);
    });
  });
};
export class SecureRename implements ObjectTransformer {

  type: ObjectTransformerType = 'Duplex';

  async transform(stream: Readable, meta: ObjectMeta, mode: ObjectTransformerMode): Promise<ObjectTransformerOutput> {
    if (mode === 'Ingress') {
      const name = await uniqueName();
      const metadata: ObjectMeta = {
        ...meta,
        originalname: meta.name,
        name,
      };

      return { meta: metadata, stream };
    } else {
      const metadata: ObjectMeta = {
        ...meta,
        name: meta.originalname,
      };
      delete metadata.originalname;

      return { stream, meta: metadata };
    }
  }

}
