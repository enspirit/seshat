import path from 'path';
import express, { Router, Request, Response, NextFunction } from 'express';
import Busboy from 'busboy';
import { Bucket } from '../../types';
import { ObjectMeta } from '@enspirit/seshat-commons';

export interface MultipartUploadConfig {
  defParamCharset?: string
  metadataHeaderPrefix?: string
}

const DefaultOptions: MultipartUploadConfig = {
  defParamCharset: 'utf-8',
  metadataHeaderPrefix: 'seshat-metadata-',
};

export const MultipartUpload = (config: MultipartUploadConfig = DefaultOptions) => (bucket: Bucket): Router => {

  const router = express();

  const isMultiPartFormDataRequest = (req: Request, _res: Response, next: NextFunction) => {
    // We only execute this router when dealing with
    // multipart-formdata requests
    const contentType = req.headers['content-type'] || '';
    if (contentType.indexOf('multipart/form-data') < 0) {
      return next('route');
    }
    next();
  };

  /**
   * Create files
   */
  router.post('/*', isMultiPartFormDataRequest, async (req, res, next) => {

    const basePath = decodeURIComponent(req.path.substring(1));
    const busboy = Busboy({
      headers: req.headers,
      defParamCharset: config.defParamCharset || 'utf-8',
    });

    const metaHeaders: Record<string, unknown> = {};

    if (config.metadataHeaderPrefix) {
      const metaHeaderPrefix = config.metadataHeaderPrefix;

      Object.keys(req.headers)
        .filter(k => k.indexOf(metaHeaderPrefix) === 0)
        .reduce((headers, key) => {
          const metaName = key.split(metaHeaderPrefix)[1];
          headers[metaName] = req.headers[key];
          return headers;
        }, metaHeaders);
    }

    const promises: Array<Promise<ObjectMeta>> = [];

    busboy.on('error', (error: Error) => {
      return next(error);
    });

    busboy.on('file', (name, file, info) => {
      const filepath = path.join(basePath, name);
      const metadata: ObjectMeta = {
        ...metaHeaders,
        name: filepath,
        contentType: info.mimeType,
      };

      const p = bucket.put(file, metadata);
      p.catch((err) => {
        return next(err);
      });
      promises.push(p);
    });

    busboy.on('finish', async () => {
      try {
        const objects = await Promise.all(promises);
        res.status(200).send(objects);
      } catch (err) {
        next(err);
      }
    });

    req.pipe(busboy);
  });

  return router;
};
