import { Readable } from 'stream';
import { ObjectTransformerError } from './errors';
import { Bucket, BucketPolicy, Object, ObjectMeta, ObjectTransformer, ObjectTransformerOutput, BucketConfig, ObjectTransformerMode } from './types';

export default abstract class AbstractBucket implements Bucket {

  constructor(
    private config: BucketConfig,
  ) {
  }

  get policies() {
    return this.config.policies || [];
  }

  get transformers() {
    return this.config.transformers || [];
  }

  async head(path: string): Promise<ObjectMeta> {
    await this.ensurePolicies((policy: BucketPolicy) => policy.head(path));
    return this._head(path);
  }

  abstract _head(path: string): Promise<ObjectMeta>;

  async get(path: string): Promise<Object> {
    await this.ensurePolicies((policy: BucketPolicy) => policy.get(path));
    const { body: stream, meta } = await this._get(path);
    const output: ObjectTransformerOutput = await this.transform(stream, meta, 'Egress');
    return { body: output.stream, meta: output.meta };
  }

  abstract _get(path: string): Promise<Object>;

  async put(stream: Readable, meta: ObjectMeta): Promise<Object> {
    await this.ensurePolicies((policy: BucketPolicy) => policy.put(meta));
    const output: ObjectTransformerOutput = await this.transform(stream, meta, 'Ingress');
    return this._put(output.stream, output.meta);
  }

  abstract _put(stream: Readable, meta: ObjectMeta): Promise<Object>;

  async delete(path: string): Promise<void> {
    await this.ensurePolicies((policy: BucketPolicy) => policy.delete(path));
    return this._delete(path);
  }

  abstract _delete(path: string): Promise<void>;

  async list(prefix?: string): Promise<ObjectMeta[]> {
    await this.ensurePolicies((policy: BucketPolicy) => policy.list(prefix));
    return this._list(prefix);
  }

  abstract _list(prefix?: string): Promise<ObjectMeta[]>;

  async exists(path: string) {
    try {
      await this.head(path);
      return true;
    } catch (err) {
      return false;
    }
  }

  private async ensurePolicies(cb: (policy: BucketPolicy) => Promise<void>): Promise<void> {
    for (const policy of this.policies) {
      await cb(policy);
    }
  }

  private async transform(stream: Readable, meta: ObjectMeta, mode: ObjectTransformerMode): Promise<ObjectTransformerOutput> {
    return this.transformers
      .filter(t => [mode, 'Duplex'].includes(t.type))
      .reduce(async (p: Promise<ObjectTransformerOutput>, t: ObjectTransformer) => {
        const { stream, meta } = await p;
        try {
          const result = await t.transform(stream, meta, mode);
          return result;
        } catch (err) {
          throw new ObjectTransformerError(`Object transformer failed: ${t.constructor.name}`);
        }
      }, Promise.resolve({ stream, meta }));
  }

}
