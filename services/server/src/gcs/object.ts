import { Readable } from 'stream';
import { Object } from '../types';
import { ObjectMeta } from '@enspirit/seshat-commons';
import { File } from '@google-cloud/storage';
import { ObjectNotFoundError } from '@enspirit/seshat-commons';

export class GCSObjectMeta implements ObjectMeta {

  constructor(
    public bucket: string,
    public name: string,
    public contentType: string,
    public ctime?: Date | undefined,
    public mtime?: Date | undefined,
    public etag?: string | undefined,
    public contentLength?: number | undefined,
  ) {
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
      new Date(file.metadata.timeCreated),
      new Date(file.metadata.updated),
      file.metadata.etag,
      file.metadata.size ? parseInt(file.metadata.size) : undefined,
    );

    if (!file.metadata?.metadata) {
      return meta;
    }

    return Object.entries(file.metadata.metadata)
      .reduce((meta: ObjectMeta, [key, value]: [string, any]): ObjectMeta => {
        meta[key] = value;
        return meta;
      }, meta) as GCSObjectMeta;
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
