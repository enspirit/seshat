import express, { NextFunction, Request, Response, Router } from 'express';
import { PrefixNotFoundError } from '../../errors';
import { Bucket } from '../../types';

export const ListObjects = () => (bucket: Bucket): Router => {
  const router = express();

  /**
   * Retrieve files
   */
  router.get('/*', async (req: Request, res: Response, next: NextFunction) => {
    const prefix = decodeURIComponent(req.path);
    if (prefix[prefix.length - 1] !== '/') {
      return next('route');
    }
    try {
      const objects = await bucket.list(prefix);
      res.send(objects);
    } catch (err) {
      if (err instanceof PrefixNotFoundError) {
        return res.sendStatus(404);
      }
      next(err);
    }
  });

  return router;
};
