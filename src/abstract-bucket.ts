import { Readable } from 'stream';
import { ObjectTransformerError } from './errors';
import { Bucket, BucketPolicy, Object, ObjectMeta, ObjectTransformer, ObjectTransformerOutput } from './types';

export default abstract class AbstractBucket implements Bucket {

  constructor(
    private policies: Array<BucketPolicy> = [],
    private transformers: Array<ObjectTransformer> = [],
  ) {
  }

  async get(path: string): Promise<Object> {
    await this.ensurePolicies((policy: BucketPolicy) => policy.get(path));
    return this._get(path);
  }

  abstract _get(path: string): Promise<Object>;

  async put(stream: Readable, meta: ObjectMeta): Promise<Object> {
    await this.ensurePolicies((policy: BucketPolicy) => policy.put(meta));
    const output: ObjectTransformerOutput = await this.transformers.reduce(async (p: Promise<ObjectTransformerOutput>, t: ObjectTransformer) => {
      const { stream, meta } = await p;
      try {
        const result = await t.transform(stream, meta);
        return result;
      } catch (err) {
        throw new ObjectTransformerError(`Object transformer failed: ${t.constructor.name}`);
      }
    }, Promise.resolve({ stream, meta }));
    return this._put(output.stream, output.meta);
  }

  abstract _put(stream: Readable, meta: ObjectMeta): Promise<Object>;

  async delete(path: string): Promise<void> {
    await this.ensurePolicies((policy: BucketPolicy) => policy.delete(path));
    return this._delete(path);
  }

  abstract _delete(path: string): Promise<void>;

  async list(prefix?: string): Promise<Object[]> {
    await this.ensurePolicies((policy: BucketPolicy) => policy.list(prefix));
    return this._list(prefix);
  }

  abstract _list(prefix?: string): Promise<Object[]>;

  async exists(path: string) {
    try {
      await this.get(path);
      return true;
    } catch (err) {
      return false;
    }
  }

  async fileExists(path: string) {
    try {
      const object = await this.get(path);
      return object.isFile;
    } catch (err) {
      return false;
    }
  }

  async dirExists(path: string) {
    try {
      const object = await this.get(path);
      return object.isDirectory;
    } catch (err) {
      return false;
    }
  }

  private async ensurePolicies(cb: (policy: BucketPolicy) => Promise<void>): Promise<void> {
    for (const policy of this.policies) {
      await cb(policy);
    }
  }

}
