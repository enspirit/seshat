import express, { NextFunction, Request, Response, Router } from 'express';
import { PrefixNotFoundError } from '../../errors';
import { Bucket, ListOptions } from '../../types';
import { requestPath } from '../../utils';

export const ListObjects = () => (bucket: Bucket): Router => {
  const router = express();

  /**
   * Retrieve files
   */
  router.get('/{*splat}', async (req: Request, res: Response, next: NextFunction) => {
    const prefix = decodeURIComponent(requestPath(req));
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
