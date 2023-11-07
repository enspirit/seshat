import EventEmitter from 'events';
import { Readable } from 'stream';
import { ObjectTransformerError, SeshatError } from '@enspirit/seshat-commons';
import { Bucket, BucketPolicy, Object, ObjectMeta, ObjectTransformer, ObjectTransformerOutput, BucketConfig, ObjectTransformerMode, BucketEmitter, BucketEvent, ListOptions } from './types';
import logger from './logger';

export default abstract class AbstractBucket implements Bucket, BucketEmitter {

  private emitter: EventEmitter;

  constructor(
    protected config: BucketConfig,
  ) {
    this.emitter = new EventEmitter();
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

  async put(stream: Readable, meta: ObjectMeta): Promise<ObjectMeta> {
    await this.ensurePolicies((policy: BucketPolicy) => policy.put(meta));
    const output: ObjectTransformerOutput = await this.transform(stream, meta, 'Ingress');
    const object = await this._put(output.stream, output.meta);
    process.nextTick(() => this.emit('stored', meta));
    return object;
  }

  abstract _put(stream: Readable, meta: ObjectMeta): Promise<ObjectMeta>;

  async delete(path: string): Promise<void> {
    await this.ensurePolicies((policy: BucketPolicy) => policy.delete(path));
    await this._delete(path);
    process.nextTick(() => this.emit('deleted', path));
  }

  abstract _delete(path: string): Promise<void>;

  async list(prefix?: string, options?: ListOptions): Promise<ObjectMeta[]> {
    await this.ensurePolicies((policy: BucketPolicy) => policy.list(prefix));
    return this._list(prefix, options);
  }

  abstract _list(prefix?: string, options?: ListOptions): Promise<ObjectMeta[]>;

  async mkdir(prefix: string): Promise<void> {
    await this.ensurePolicies((policy: BucketPolicy) => policy.mkdir(prefix));
    return this._mkdir(prefix);
  }

  abstract _mkdir(prefix?: string): Promise<void>;

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
          logger.error(err);
          if (err instanceof SeshatError) {
            throw err;
          }
          throw new ObjectTransformerError(`Object transformer failed: ${t.constructor.name}`, err as Error);
        }
      }, Promise.resolve({ stream, meta }));
  }

  on<U extends keyof BucketEvent>(event: U, listener: BucketEvent[U]): this {
    this.emitter.on(event, listener);
    return this;
  }

  off<U extends keyof BucketEvent>(event: U, listener: BucketEvent[U]): this {
    this.emitter.off(event, listener);
    return this;
  }

  emit<U extends keyof BucketEvent>(event: U, ...args: Parameters<BucketEvent[U]>): boolean {
    return this.emitter.emit(event, ...args);
  }

}
