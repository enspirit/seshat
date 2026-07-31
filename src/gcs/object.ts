import { Readable } from 'stream';
import type { SeshatObject, SeshatObjectMeta } from '../types.js';
import { File } from '@google-cloud/storage';
import { ObjectNotFoundError } from '../errors.js';

export class GCSObjectMeta implements SeshatObjectMeta {
  #bucket;

  constructor(
    bucket: string,
    public name: string,
    public contentType: string,
    public ctime?: Date | undefined,
    public mtime?: Date | undefined,
    public etag?: string | undefined,
    public contentLength?: number | undefined,
  ) {
    this.#bucket = bucket;
  }

  static async fromFile(file: File, prefix?: string): Promise<GCSObjectMeta> {
    const [exists] = await file.exists();
    if (!exists) {
      throw new ObjectNotFoundError(`Object ${file.name} not found`);
    }
    const meta = new GCSObjectMeta(
      file.bucket.name,
      prefix ? file.name.substring(prefix.length) : file.name,
      file.metadata.contentType || 'application/octet-stream',
      // These are all optional in @google-cloud/storage 7's FileMetadata, and
      // size widened to string | number. Absent timestamps now yield undefined
      // rather than the Invalid Date that new Date(undefined) used to produce.
      file.metadata.timeCreated ? new Date(file.metadata.timeCreated) : undefined,
      file.metadata.updated ? new Date(file.metadata.updated) : undefined,
      file.metadata.etag,
      file.metadata.size === undefined ? undefined : Number(file.metadata.size),
    );

    if (!file.metadata?.metadata) {
      return meta;
    }

    return Object.entries(file.metadata.metadata)
      .reduce((meta: SeshatObjectMeta, [key, value]: [string, any]): SeshatObjectMeta => {
        meta[key] = value;
        return meta;
      }, meta) as GCSObjectMeta;
  }

}

export class GCSObject implements SeshatObject {

  meta: GCSObjectMeta;
  body: Readable;

  constructor(
    meta: GCSObjectMeta,
    body: Readable,
  ) {
    this.meta = meta;
    this.body = body;
  }

  static async fromFile(file: File, prefix?: string): Promise<GCSObject> {
    const meta = await GCSObjectMeta.fromFile(file, prefix);
    const stream = file.createReadStream();
    return new GCSObject(meta, stream);
  }

}
