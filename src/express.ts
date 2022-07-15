import * as express from 'express';
import AbstractBucket from './bucket';
import { ObjectNotFoundError } from './errors';
import * as busboy from 'busboy';

export interface SeshatConfig {
  bucket: AbstractBucket
}

export const createApp = (config: SeshatConfig): express.Express => {
  const app = express();
  const { bucket } = config;

  app.get('/*', async (req, res) => {
    const fpath = req.params[0];
    try {
      const object = await bucket.get(fpath);
      res.set('Content-Type', object.contentType);
      res.set('Content-Length', object.contentLength.toString());
      object.getReadableStream().pipe(res);
    } catch (err) {
      if (err instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.status(500).send(err.message);
    }
  });

  app.delete('/*', async (req, res) => {
    const fpath = req.params[0];
    try {
      await bucket.delete(fpath);
      res.sendStatus(204);
    } catch (err) {
      if (err instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.status(500).send(err.message);
    }
  });

  app.post('/', (req, res) => {
    const bb = busboy({ headers: req.headers });

    bb.on('file', async (_fieldname, file, fileinfo) => {
      console.log('file:', file, fileinfo);
      await bucket.put(fileinfo.filename, file);
    });

    bb.on('close', () => {
      res.sendStatus(204);
    });

    req.pipe(bb);
  });

  return app;
};
