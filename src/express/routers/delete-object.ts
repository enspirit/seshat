import express, { Router } from 'express';
import { Config } from '../../types';
import { ObjectNotFoundError } from '../../errors';

export const createRouter = (config: Config): Router => {
  const { bucket } = config;
  const router = express();

  /**
   * Delete object
   */
  router.delete('*', async (req, res) => {
    const fpath = req.path;
    try {
      await bucket.delete(fpath);
      res.sendStatus(204);
    } catch (err: any) {
      if (err instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.status(500).send(err.message);
    }
  });

  return router;
};
