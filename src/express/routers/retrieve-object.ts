import express, { NextFunction, Request, Response, Router, RequestHandler } from 'express';
import { Config } from '../../types';
import { ObjectNotFoundError } from '../../errors';

export interface RetrieveObjectConfig {
  downloadAs: {
    enabled: boolean,
    queryParam: string
  }
}

export const DefaultConfig: RetrieveObjectConfig = {
  downloadAs: {
    enabled: true,
    queryParam: 'download',
  },
};

export const createRouter = (seshatConfig: Config, routerConfig: RetrieveObjectConfig = DefaultConfig): Router => {
  const router = express();
  const { bucket } = seshatConfig;

  /**
   * Expose the object on the request
   */
  const exposeObject: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    if (req.seshat && req.seshat.object) {
      return next();
    }
    req.seshat ||= {
      bucket,
    };
    try {
      const path = req.path.substring(1);
      req.seshat.object = await bucket.get(path);
    } catch (err) {
      if (!(err instanceof ObjectNotFoundError)) {
        next(err);
      }
    }
    next();
  };

  /**
   * Allows a user to download a file as an attachment with different name
   */
  const downloadAs: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
    if (!Object.hasOwnProperty.call(req.query, routerConfig.downloadAs.queryParam)) {
      return next();
    }

    const filename = req.query[routerConfig.downloadAs.queryParam] || req.seshat.object?.meta.name;
    if (filename) {
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    }
    next();
  };

  const middlewares: RequestHandler[] = [exposeObject];

  if (routerConfig.downloadAs.enabled) {
    middlewares.push(downloadAs);
  }

  /**
   * Retrieve files
   */
  router.get('/*', middlewares, async (req: Request, res: Response) => {
    const { object } = req.seshat;
    if (!object) {
      return res
        .status(404)
        .send({ error: `File not found: ${req.path}` });
    }
    res.set('Content-Type', object.meta.contentType);
    if (object.meta.contentLength) {
      res.set('Content-Length', object.meta.contentLength.toString());
    }
    object.body.pipe(res);
  });

  return router;
};
