import express, { Router } from 'express';
import { Config } from '../../types';

export const createRouter = (config: Config): Router => {
  const { bucket } = config;
  const router = express();

  /**
   * Delete object
   */
  router.delete('/*', async (req, res, next) => {
    const fpath = req.path.substring(1);
    try {
      await bucket.delete(fpath);
      res.sendStatus(204);
    } catch (err: any) {
      next(err);
    }
  });

  return router;
};
