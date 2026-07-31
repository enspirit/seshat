import express, { type NextFunction, type Request, type Response, Router } from 'express';
import { PrefixNotFoundError } from '../../errors.js';
import { type Bucket, type ListOptions } from '../../types.js';
import { requestPath } from '../../utils/index.js';

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
