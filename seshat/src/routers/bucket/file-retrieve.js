import express from 'express';
import etag from 'etag';
import { FileNotFoundError } from '../../robust/errors';
import mime from 'mime-types';

export default ({ storage, ...config }) => {
  const router = express.Router();

  router.get(/^(.*)$/, (req, res, next) => {
    if (!req.dirent || !req.dirent.isFile()) {
      return next();
    }
    storage.get(req.dirent.name)
      .then((filestream) => {
        if (config.lastModified) {
          res.setHeader('Last-Modified', req.dirent.mtime);
        }
        if (config.etag) {
          res.setHeader('ETag', etag(req.dirent));
        }
        if (config.cacheControl) {
          res.setHeader('Cache-Control', config.cacheControl);
        }
        const mimeType = mime.lookup(req.dirent.name);
        res.setHeader('Content-Type', mimeType);
        if (req.query.n) {
          const filename = encodeURIComponent(req.query.n);
          res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        }
        filestream.pipe(res);
      })
      .catch((err) => {
        if (err instanceof FileNotFoundError) {
          res.sendStatus(404);
        } else {
          next(err);
        }
      });
  });

  return router;
};
