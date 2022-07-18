import express from 'express';
import { SeshatConfig } from './types';
import { ObjectNotFoundError } from './errors';
import busboy from 'busboy';

export const createApp = (config: SeshatConfig): express.Express => {
  const app = express();
  const { bucket } = config;

  app.get('/*', async (req, res) => {
    const fpath = req.params[0];
    try {
      const object = await bucket.get(fpath);
      if (object.isDirectory) {
        throw new ObjectNotFoundError('Prefix found instead of object');
      }
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

    const promises = [];

    bb.on('file', async (_fieldname, file, fileinfo) => {
      promises.push(bucket.put(fileinfo.filename, file));
    });

    bb.on('finish', async () => {
      const objects = await Promise.all(promises);
      res.status(200).send(objects);
    });

    req.pipe(bb);
  });

  return app;
};
