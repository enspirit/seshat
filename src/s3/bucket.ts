import { Readable } from 'stream';
import AbstractBucket from '../abstract-bucket.js';
import type { BucketConfig, ListOptions, SeshatObject, SeshatObjectMeta } from '../types.js';
import { S3Object } from './object.js';

import { S3Client, HeadObjectCommand, ListObjectsV2Command, DeleteObjectCommand, GetObjectCommand, PutObjectCommand, type ListObjectsV2CommandInput, type GetObjectCommandInput, type PutObjectCommandInput, type HeadObjectCommandInput } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { ObjectNotFoundError, PresignNotSupportedError, PrefixNotFoundError } from '../errors.js';
import type { PresignedUpload } from '../types.js';

export interface S3BucketConfig extends BucketConfig {
  bucket: string,
  s3client: S3Client,
  /**
   * Client used to sign presigned upload URLs, when that has to differ from
   * `s3client`.
   *
   * Two things can force them apart. A signature covers the Host header, so the
   * URL must be signed against the address the *client* will reach - which is
   * not the same as this process's address whenever storage sits behind a
   * private network, as it does in most docker setups. And presigning requires
   * a client built with `requestChecksumCalculation: 'WHEN_REQUIRED'`, which
   * you may not want to impose on the client doing ordinary reads and writes.
   *
   * Against real S3 neither usually applies, and this can be left unset.
   */
  presignClient?: S3Client,
  prefix?: string
}

export class S3Bucket extends AbstractBucket {

  private s3client: S3Client;
  private presignClient: S3Client;
  private bucket: string;
  private prefix?: string;

  constructor(
    config: S3BucketConfig,
  ) {
    super(config);
    this.s3client = config.s3client;
    this.presignClient = config.presignClient || config.s3client;
    this.bucket = config.bucket;
    this.prefix = config.prefix;
  }

  async _head(path: string): Promise<SeshatObjectMeta> {
    const params: HeadObjectCommandInput = {
      Bucket: this.bucket,
      Key: this.objectKey(path),
    };

    if (this.config.encryption) {
      params.SSECustomerAlgorithm = this.config.encryption.alg;
      params.SSECustomerKey = this.config.encryption.key;
    }

    try {
      const headOutput = await this.s3client.send(new HeadObjectCommand(params));
      return S3Object.metaFromCommandOutput(this.bucket, path, headOutput);
    } catch (err: any) {
      if (['NotFound', 'NoSuchKey'].includes(err.name)) {
        throw new ObjectNotFoundError(`Object ${path} not found`);
      }
      throw err;
    }
  }

  async _get(path: string): Promise<SeshatObject> {
    const params: GetObjectCommandInput = {
      Bucket: this.bucket,
      Key: this.objectKey(path),
    };

    if (this.config.encryption) {
      params.SSECustomerAlgorithm = this.config.encryption.alg;
      params.SSECustomerKey = this.config.encryption.key;
    }

    try {
      const object = await this.s3client.send(new GetObjectCommand(params));
      return S3Object.fromGetObjectCommandOutput(this.bucket, path, object);
    } catch (err: any) {
      if (['NotFound', 'NoSuchKey'].includes(err.name)) {
        throw new ObjectNotFoundError(`Object ${path} not found`);
      }
      throw err;
    }
  }

  async _put(stream: Readable, meta: SeshatObjectMeta): Promise<SeshatObjectMeta> {
    // Some of the metadata can be stored in standard s3 properties
    const { contentType, name, ...rest } = meta;
    const metadata = Object.entries(rest)
      .reduce((obj, [key, value]) => {
        obj[key] = encodeURIComponent(value.toString ? value.toString() : value);
        return obj;
      }, {} as {[key: string]: string});

    const target: PutObjectCommandInput = {
      Key: this.objectKey(name),
      Bucket: this.bucket,
      ContentType: contentType,
      Body: stream,
      Metadata: {
        ...metadata,
      },
    };

    if (this.config.encryption) {
      target.SSECustomerAlgorithm = this.config.encryption.alg;
      target.SSECustomerKey = this.config.encryption.key;
    }

    const upload = new Upload({
      client: this.s3client,
      queueSize: 4,
      params: target,
    });

    await upload.done();

    return this._head(meta.name);
  }

  async _delete(path: string): Promise<void> {
    // ensure object exists before deleting it
    // in this, seshat differs from plain S3
    await this._head(path);
    await this.s3client.send(new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: this.objectKey(path),
    }));
  }

  async _list(prefix?: string | undefined, options?: ListOptions): Promise<SeshatObjectMeta[]> {
    const params: ListObjectsV2CommandInput = {
      Bucket: this.bucket,
      Prefix: this.objectKey(prefix),
      Delimiter: '/',
    };

    if (options && options.recursive === true) {
      delete params.Delimiter;
    }

    const res = await this.s3client.send(new ListObjectsV2Command(params));

    // Prefixes
    const prefixes = options?.recursive ? [] : (res.CommonPrefixes || []).map((entry) => {
      return {
        name: entry.Prefix as string,
        contentType: 'seshat/prefix',
      };
    });

    // Objects
    const promises = (res.Contents || []).map((object) => {
      return this._head(this.seshatKey(object.Key as string));
    });
    const objects = await Promise.all(promises);

    // Combine both prefixes & objects
    const results = [...objects, ...prefixes];
    if (!results.length) {
      throw new PrefixNotFoundError(`Unable to find objects with prefix ${prefix}`);
    }

    // Sorted by name
    return results.sort((a,b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));
  }

  async _mkdir(prefix: string): Promise<void> {

    let folderName = this.objectKey(prefix);
    // ensure we have a trailing slash
    if (folderName[folderName.length - 1] !== '/') {
      folderName = `${folderName}/`;
    }

    const target = {
      Key: folderName,
      Bucket: this.bucket,
      Body: '',
    };

    const upload = new Upload({
      client: this.s3client,
      queueSize: 1,
      params: target,
    });

    await upload.done();
  }

  /**
   * Given that an s3 bucket can be configured with a static prefix (see S3BucketOptions)
   * we want to ensure that all object Keys are taking into consideration that optional parameter.
   *
   * We therefore need helpers to include/remove this prefix from object Keys
   */

  protected async _presignUpload(meta: SeshatObjectMeta, expiresIn: number): Promise<PresignedUpload> {
    if (this.config.encryption) {
      throw new PresignNotSupportedError(
        'Cannot presign uploads on an SSE-C encrypted bucket: the client would have to be ' +
        'given the encryption key.');
    }

    await this.ensurePresignableClient();

    const { contentType, contentLength, name, ...rest } = meta;
    // Encoded as _put() encodes it, so custom metadata reads back the same
    // whichever way the object arrived. Unlike _put() this drops contentLength,
    // which S3 carries as a standard field on a signed PUT.
    const metadata = Object.entries(rest)
      .reduce((obj, [key, value]) => {
        obj[key] = encodeURIComponent(value?.toString ? value.toString() : value);
        return obj;
      }, {} as {[key: string]: string});

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: this.objectKey(name),
      ContentType: contentType,
      ContentLength: contentLength,
      Metadata: metadata,
    });

    const url = await getSignedUrl(this.presignClient, command, {
      expiresIn,
      // Without this the signature covers only content-length and host, leaving
      // the client free to declare any content-type it likes - which would let
      // it walk straight past a content-type policy that had already approved
      // the request.
      signableHeaders: new Set(['content-type']),
    });

    return {
      url,
      method: 'PUT',
      // Only what the client has to replay. The x-amz-meta-* entries are hoisted
      // into the URL's query string by the signer and are covered by the
      // signature there, so repeating them as headers would be noise at best.
      headers: {
        'content-type': contentType,
        'content-length': String(contentLength),
      },
      name,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
    };
  }

  /**
   * The SDK defaults `requestChecksumCalculation` to WHEN_SUPPORTED, which makes
   * it compute a CRC32 over the request body and hoist it into the signed URL.
   * At signing time that body is empty, so the URL ends up carrying the checksum
   * of nothing and S3 rejects the real upload when it arrives.
   *
   * It is a client-construction setting and the client is handed to us already
   * built, so the most we can do is refuse early. Failing here - with something
   * that names the fix - beats handing back a URL that dies at the far end, in
   * someone else's process, against a checksum they never asked for.
   */
  private async ensurePresignableClient(): Promise<void> {
    const configured = (this.presignClient.config as { requestChecksumCalculation?: unknown }).requestChecksumCalculation;
    const value = typeof configured === 'function'
      ? await (configured as () => Promise<string>)()
      : configured;

    if (value !== 'WHEN_REQUIRED') {
      throw new PresignNotSupportedError(
        'Cannot presign uploads with this S3Client: it computes request checksums ' +
        `(requestChecksumCalculation: '${value}'), which the signer binds into the URL as a ` +
        'checksum of an empty body, so the upload would be rejected. Construct the client with ' +
        'requestChecksumCalculation: \'WHEN_REQUIRED\' to presign.');
    }
  }

  private objectKey(path?: string): string {
    return (this.prefix || '') + (path || '');
  }

  private seshatKey(key: string): string {
    return key.substring((this.prefix || '').length);
  }
}
