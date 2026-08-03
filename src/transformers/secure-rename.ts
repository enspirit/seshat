import crypto from 'crypto';
import path from 'path';
import { Readable } from 'stream';
import { type SeshatObjectMeta, type ObjectTransformer, type ObjectTransformerMode, type ObjectTransformerOutput, type ObjectTransformerType } from '../types.js';

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

export interface SecureRenameOptions {
  nameGenerator?: () => Promise<string>
  keepPrefix?: boolean,
  keepExtension?: boolean
}

const DefaultOptions: SecureRenameOptions = {
  nameGenerator: uniqueName,
  keepPrefix: true,
  keepExtension: true,
};

export class SecureRename implements ObjectTransformer {

  constructor(private options: SecureRenameOptions = DefaultOptions) {
    this.options = Object.assign(DefaultOptions, options);
  }

  get nameGenerator() {
    return this.options.nameGenerator || DefaultOptions.nameGenerator as () => Promise<string>;
  }

  type: ObjectTransformerType = 'Duplex';

  async transform(stream: Readable, meta: SeshatObjectMeta, mode: ObjectTransformerMode): Promise<ObjectTransformerOutput> {
    return { stream, meta: await this.transformMeta(meta, mode) };
  }

  async transformMeta(meta: SeshatObjectMeta, mode: ObjectTransformerMode): Promise<SeshatObjectMeta> {
    if (mode === 'Ingress') {
      const generated = await this.nameGenerator();
      const info = path.parse(meta.name);
      let name = this.options.keepPrefix ? path.join(info.dir, generated) : generated;
      name = this.options.keepExtension ? `${name}${info.ext}` : name;
      const metadata: SeshatObjectMeta = {
        ...meta,
        originalname: meta.name,
        name,
      };

      return metadata;
    } else {
      const metadata: SeshatObjectMeta = {
        ...meta,
        // Falls back to the stored name: an object written straight to the
        // backend without an `originalname` (a presigned upload whose metadata
        // was dropped, say) would otherwise come back with name undefined.
        name: meta.originalname ?? meta.name,
      };
      delete metadata.originalname;

      return metadata;
    }
  }

}
