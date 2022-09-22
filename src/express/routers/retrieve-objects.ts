import express, { NextFunction, Request, Response, Router, RequestHandler } from 'express';
import { Bucket } from '../../types';
import { ObjectNotFoundError } from '../../errors';
import { nextTick } from 'node:process';

export interface RetrieveObjectConfig {
  downloadAs: {
    enabled: boolean
    queryParam: string
  },
  headers: {
    lastModified: boolean
    etag: boolean
  }
}

export const DefaultConfig: RetrieveObjectConfig = {
  downloadAs: {
    enabled: true,
    queryParam: 'download',
  },
  headers: {
    lastModified: true,
    etag: true,
  },
};

export const RetrieveObjects = (config: RetrieveObjectConfig = DefaultConfig) => (bucket: Bucket): Router => {
  const router = express();

  /**
   * Expose the object on the request
   */
  const exposeObject: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    const isPrefix = req.path[req.path.length - 1] === '/';
    if (isPrefix) {
      return next('route');
    }

    if (req.seshat && req.seshat.object) {
      return next();
    }
    req.seshat.bucket ||= bucket;
    try {
      const path = decodeURIComponent(req.path.substring(1));
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
    if (!Object.hasOwnProperty.call(req.query, config.downloadAs.queryParam)) {
      return next();
    }

    const filename = req.query[config.downloadAs.queryParam] || req.seshat.object?.meta.name;
    if (filename) {
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    }
    next();
  };

  const middlewares: RequestHandler[] = [exposeObject];

  if (config.downloadAs.enabled) {
    middlewares.push(downloadAs);
  }

  /**
   * Retrieve files
   */
  router.get('/*', middlewares, async (req: Request, res: Response, next: NextFunction) => {
    const { object } = req.seshat;

    if (!object) {
      return res
        .status(404)
        .send({ error: `File not found: ${req.path}` });
    }
    res.set('Content-Type', object.meta.contentType);
    if (config.headers.lastModified && object.meta.mtime) {
      res.setHeader('Last-Modified', object.meta.mtime?.toString());
    }
    if (config.headers.etag && object.meta.etag) {
      res.setHeader('ETag', object.meta.etag);
    }
    if (object.meta.contentLength) {
      res.set('Content-Length', object.meta.contentLength.toString());
    }
    object.body.on('error', (err) => {
      next(err);
    });
    object.body.pipe(res);
  });

  return router;
};
