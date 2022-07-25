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
    queryParam: 'downloadAs',
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
      req.seshat.object = await bucket.get(req.path);
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
    const filename = req.query[routerConfig.downloadAs.queryParam];
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
   * Retrieve file actions
   */
  router.get('*', middlewares, async (req: Request, res: Response) => {
    const { object } = req.seshat;
    if (!object) {
      return res
        .status(404)
        .send({ error: `File not found: ${req.path}` });
    }
    try {
      res.set('Content-Type', object.meta.contentType);
      if (object.meta.contentLength) {
        res.set('Content-Length', object.meta.contentLength.toString());
      }
      const stream = await object.getReadableStream();
      stream.pipe(res);
    } catch (err: any) {

      if (err instanceof ObjectNotFoundError) {
        return res
          .status(404)
          .send({ error: `File not found: ${req.path}` });
      }

      return res.status(500).send(err.message);
    }
  });

  return router;
};
