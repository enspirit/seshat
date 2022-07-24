import path from 'path';
import express, { Router, Request, Response, NextFunction } from 'express';
import Busboy from 'busboy';
import { Config, ObjectMeta, Object } from '../../types';

export const createRouter = (config: Config): Router => {

  const { bucket } = config;
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
  router.post('*', isMultiPartFormDataRequest, async (req, res) => {

    const basePath = req.path;
    const busboy = Busboy({ headers: req.headers });
    const promises: Array<Promise<Object>> = [];

    busboy.on('error', (error: Error) => {
      return res.status(500).send({ error: error.message });
    });

    busboy.on('file', (name, file, info) => {
      const filepath = path.join(basePath, name);
      const metadata: ObjectMeta = {
        name: filepath,
        mimeType: info.mimeType,
      };
      promises.push(bucket.put(file, metadata));
    });

    busboy.on('finish', async () => {
      const objects = await Promise.all(promises);
      res.status(200).send(objects);
    });

    req.pipe(busboy);
  });

  return router;
};
