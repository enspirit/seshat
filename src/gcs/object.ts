import { Readable } from 'stream';
import { Object, ObjectMeta } from '../types';
import { File } from '@google-cloud/storage';
import { ObjectNotFoundError } from '../errors';

export class GCSObjectMeta implements ObjectMeta {
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
    return new GCSObjectMeta(
      file.bucket.name,
      prefix ? file.name.substring(prefix.length) : file.name,
      file.metadata.contentType || 'application/octet-stream',
      file.metadata.timeCreated,
      file.metadata.updated,
      file.metadata.etag,
      file.metadata.size ? parseInt(file.metadata.size) : undefined,
    );
  }

}

export class GCSObject implements Object {

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
