import * as express from 'express';
import AbstractBucket from './bucket';
import { ObjectNotFoundError } from './errors';

export interface SeshatConfig {
  bucket: AbstractBucket
}

export const createApp = (config: SeshatConfig): express.Express => {
  const app = express();

  app.get('/*', async (req, res) => {
    const fpath = req.params[0];
    try {
      const object = await config.bucket.get(fpath);
      res.set('Content-Type', object.contentType);
      res.set('Content-Length', object.contentLength.toString());
      object.getReadableStream().pipe(res);
    } catch (err) {
      if (err instanceof ObjectNotFoundError) {
        return res.send(404);
      }
      return res.status(500).send(err.message);
    }
  });

  app.delete('/*', async (req, res) => {
    const fpath = req.params[0];
    try {
      await config.bucket.delete(fpath);
      res.sendStatus(204);
    } catch (err) {
      if (err instanceof ObjectNotFoundError) {
        return res.send(404);
      }
      return res.status(500).send(err.message);
    }
  });

  return app;
};
