import express, { Router } from 'express';
import { Bucket } from '../../types';

export const DeleteObjects = () => (bucket: Bucket): Router => {
  const router = express();

  /**
   * Delete object
   */
  router.delete('/*', async (req, res, next) => {
    const fpath = decodeURI(req.path.substring(1));
    try {
      await bucket.delete(fpath);
      res.sendStatus(204);
    } catch (err: any) {
      next(err);
    }
  });

  return router;
};
