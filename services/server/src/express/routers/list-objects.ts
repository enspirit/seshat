import express, { NextFunction, Request, Response, Router } from 'express';
import { PrefixNotFoundError } from '@enspirit/seshat-commons';
import { Bucket, ListOptions } from '../../types';

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

    const options: ListOptions = {
      recursive: req.query.recursive === 'true' || false,
    };

    try {
      const objects = await bucket.list(prefix.substring(1), options);
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
