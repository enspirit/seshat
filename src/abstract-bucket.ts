import { Readable } from 'stream';
import { SeshatBucket, SeshatBucketPolicy, SeshatObject, SeshatObjectMeta } from './types';

export default abstract class AbstractBucket implements SeshatBucket {

  constructor(private policies: Array<SeshatBucketPolicy> = []) {
  }

  async get(path: string): Promise<SeshatObject> {
    await this.ensurePolicies((policy: SeshatBucketPolicy) => policy.get(path));
    return this._get(path);
  }

  abstract _get(path: string): Promise<SeshatObject>;

  async put(path: string, stream: Readable, meta: SeshatObjectMeta): Promise<SeshatObject> {
    await this.ensurePolicies((policy: SeshatBucketPolicy) => policy.put(path, meta));
    return this._put(path, stream, meta);
  }

  abstract _put(path: string, stream: Readable, meta: SeshatObjectMeta): Promise<SeshatObject>;

  async delete(path: string): Promise<void> {
    await this.ensurePolicies((policy: SeshatBucketPolicy) => policy.delete(path));
    return this._delete(path);
  }

  abstract _delete(path: string): Promise<void>;

  async list(prefix?: string): Promise<SeshatObject[]> {
    await this.ensurePolicies((policy: SeshatBucketPolicy) => policy.list(prefix));
    return this._list(prefix);
  }

  abstract _list(prefix?: string): Promise<SeshatObject[]>;

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

  private async ensurePolicies(cb: (policy: SeshatBucketPolicy) => Promise<void>): Promise<void> {
    for (const policy of this.policies) {
      await cb(policy);
    }
  }

}
