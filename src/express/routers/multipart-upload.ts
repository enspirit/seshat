import path from 'path';
import express, { Router, Request, Response, NextFunction } from 'express';
import Busboy from 'busboy';
import { Bucket, ObjectMeta, Object } from '../../types';

export const MultipartUpload = () => (bucket: Bucket): Router => {

  const router = express();

  const isMultiPartFormDataRequest = (req: Request, res: Response, next: NextFunction) => {
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

    const basePath = req.path.substring(1);
    const busboy = Busboy({ headers: req.headers });
    const objects: Array<ObjectMeta> = [];

    busboy.on('error', (error: Error) => {
      return next(error);
    });

    busboy.on('file', async (name, file, info) => {
      const filepath = path.join(basePath, name);
      const metadata: ObjectMeta = {
        name: filepath,
        contentType: info.mimeType,
      };
      const object = await bucket.put(file, metadata);
      objects.push(object.meta);
    });

    busboy.on('finish', () => {
      res.send(objects);
    });

    req.pipe(busboy);
  });

  return router;
};
