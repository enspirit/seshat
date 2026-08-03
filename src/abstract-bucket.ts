import EventEmitter from 'events';
import { Readable } from 'stream';
import { ObjectTransformerError, PresignNotSupportedError, SeshatError } from './errors.js';
import type { Bucket, BucketPolicy, SeshatObject, SeshatObjectMeta, ObjectTransformer, ObjectTransformerOutput, BucketConfig, ObjectTransformerMode, BucketEmitter, BucketEvent, ListOptions, PresignedUpload, PresignedUploadRequest } from './types.js';
import { DefaultPresignExpiresIn, isMetaTransformer } from './types.js';
import logger from './logger.js';

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

  async head(path: string): Promise<SeshatObjectMeta> {
    await this.ensurePolicies((policy: BucketPolicy) => policy.head(path));
    return this._head(path);
  }

  abstract _head(path: string): Promise<SeshatObjectMeta>;

  async get(path: string): Promise<SeshatObject> {
    await this.ensurePolicies((policy: BucketPolicy) => policy.get(path));
    const { body: stream, meta } = await this._get(path);
    const output: ObjectTransformerOutput = await this.transform(stream, meta, 'Egress');
    return { body: output.stream, meta: output.meta };
  }

  abstract _get(path: string): Promise<SeshatObject>;

  async put(stream: Readable, meta: SeshatObjectMeta): Promise<SeshatObjectMeta> {
    await this.ensurePolicies((policy: BucketPolicy) => policy.put(meta));
    const output: ObjectTransformerOutput = await this.transform(stream, meta, 'Ingress');
    const object = await this._put(output.stream, output.meta);
    process.nextTick(() => this.emit('stored', meta));
    return object;
  }

  abstract _put(stream: Readable, meta: SeshatObjectMeta): Promise<SeshatObjectMeta>;

  /**
   * Hands back a short-lived URL the caller PUTs the bytes to directly.
   *
   * The bytes never reach this process, which is the entire point and also the
   * entire cost: nothing here can scan, resize or compress them. Policies still
   * apply, and run against the pre-rename metadata exactly as put() does, so a
   * policy sees the same input either way. Transformers are the part that
   * cannot survive - see transformMetaOnly.
   *
   * Note that `stored` does not fire: this bucket never learns whether the
   * upload happened.
   */
  async presignUpload(request: PresignedUploadRequest): Promise<PresignedUpload> {
    const meta: SeshatObjectMeta = {
      // Spread first, exactly as MultipartUpload does: custom metadata is
      // caller-supplied, and letting it land on top would let a `name` entry
      // move the object key out of the path the request addressed, or a
      // `contentLength` entry replace the value the action just checked against
      // its ceiling.
      ...request.metadata,
      name: request.name,
      contentType: request.contentType,
      contentLength: request.contentLength,
    };

    await this.ensurePolicies((policy: BucketPolicy) => policy.put(meta));
    const transformed = await this.transformMetaOnly(meta, 'Ingress');

    return this._presignUpload(transformed, request.expiresIn ?? DefaultPresignExpiresIn);
  }

  /**
   * Runs the transformer chain in metadata-only mode, refusing outright on any
   * transformer that rewrites content. Refusing is the point: silently skipping
   * a Clamav or Sharp transformer would hand back a URL that bypasses a
   * guarantee the bucket was configured to make.
   */
  private async transformMetaOnly(meta: SeshatObjectMeta, mode: ObjectTransformerMode): Promise<SeshatObjectMeta> {
    return this.transformers
      .filter(t => [mode, 'Duplex'].includes(t.type))
      .reduce(async (previous: Promise<SeshatObjectMeta>, transformer: ObjectTransformer) => {
        const current = await previous;
        if (!isMetaTransformer(transformer)) {
          throw new PresignNotSupportedError(
            'Cannot presign uploads on a bucket configured with the content transformer ' +
            `'${transformer.constructor.name}': the bytes never reach Seshat, so it cannot run.`);
        }
        return transformer.transformMeta(current, mode);
      }, Promise.resolve(meta));
  }

  /**
   * Concrete, not abstract, so a backend with no signing authority - LocalBucket
   * - inherits the refusal without needing code of its own.
   */
  protected async _presignUpload(_meta: SeshatObjectMeta, _expiresIn: number): Promise<PresignedUpload> {
    throw new PresignNotSupportedError(
      `${this.constructor.name} does not support presigned uploads`);
  }

  async delete(path: string): Promise<void> {
    await this.ensurePolicies((policy: BucketPolicy) => policy.delete(path));
    await this._delete(path);
    process.nextTick(() => this.emit('deleted', path));
  }

  abstract _delete(path: string): Promise<void>;

  async list(prefix?: string, options?: ListOptions): Promise<SeshatObjectMeta[]> {
    await this.ensurePolicies((policy: BucketPolicy) => policy.list(prefix));
    return this._list(prefix, options);
  }

  abstract _list(prefix?: string, options?: ListOptions): Promise<SeshatObjectMeta[]>;

  async mkdir(prefix: string): Promise<void> {
    await this.ensurePolicies((policy: BucketPolicy) => policy.mkdir(prefix));
    return this._mkdir(prefix);
  }

  abstract _mkdir(prefix?: string): Promise<void>;

  async exists(path: string) {
    try {
      await this.head(path);
      return true;
    } catch {
      return false;
    }
  }

  private async ensurePolicies(cb: (policy: BucketPolicy) => Promise<void>): Promise<void> {
    for (const policy of this.policies) {
      await cb(policy);
    }
  }

  private async transform(stream: Readable, meta: SeshatObjectMeta, mode: ObjectTransformerMode): Promise<ObjectTransformerOutput> {
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
