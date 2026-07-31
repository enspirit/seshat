import express, { Router } from 'express';
import { Bucket } from '../../types';
import { requestPath } from '../../utils';

export const DeleteObjects = () => (bucket: Bucket): Router => {
  const router = express();

  /**
   * Delete object
   */
  router.delete('/{*splat}', async (req, res, next) => {
    const fpath = decodeURIComponent(requestPath(req).substring(1));
    try {
      await bucket.delete(fpath);
      res.sendStatus(204);
    } catch (err: any) {
      next(err);
    }
  });

  return router;
};
