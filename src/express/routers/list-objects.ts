import express, { NextFunction, Request, Response, Router } from 'express';
import { Config } from '../../types';

export interface ListObjectsConfig {
}

export const DefaultConfig: ListObjectsConfig = {
};

export const createRouter = (seshatConfig: Config, _routerConfig: ListObjectsConfig = DefaultConfig): Router => {
  const router = express();
  const { bucket } = seshatConfig;

  /**
   * Retrieve files
   */
  router.get('/*', async (req: Request, res: Response, next: NextFunction) => {
    const prefix = req.path;
    if (prefix[prefix.length - 1] !== '/') {
      return next('route');
    }
    const objects = await bucket.list(prefix);
    res.send(objects);
  });

  return router;
};
