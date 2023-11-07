import crypto from 'crypto';
import path from 'path';
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

  async transform(stream: Readable, meta: ObjectMeta, mode: ObjectTransformerMode): Promise<ObjectTransformerOutput> {
    if (mode === 'Ingress') {
      const generated = await this.nameGenerator();
      const info = path.parse(meta.name);
      let name = this.options.keepPrefix ? path.join(info.dir, generated) : generated;
      name = this.options.keepExtension ? `${name}${info.ext}` : name;
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
