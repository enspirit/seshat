import express from 'express';
import multipartHandler from './mime-handlers/multipart-form-data';
import defaultHandler from './mime-handlers/default';
import logger from '../../logger';
import { FileNotFoundError } from '../../robust/errors';

const initPipeline = (typology, path) => (req, res, next) => {
  req.pipeline = typology.getPipeline(req);

  req.pipeline.on('error', (err) => {
    if (err instanceof FileNotFoundError) {
      return res.sendStatus(404);
    }
    next(err);
  });

  req.pipeline.on('success', (files) => {
    const file = files[0];
    let location = file.filename;
    if (file.path !== '/') {
      location = file.path + '/' + encodeURIComponent(file.filename);
    }
    if (file.originalFilename) {
      location = location + '?n=' + encodeURIComponent(file.originalFilename);
    }

    location = (path + location).replace(/\/\/+/g, '/');
    logger.debug('Location set to `' + location + '`');
    res.location(location);
    res.sendStatus(204);
  });

  next();
};

export default ({ typology, path }) => {
  const router = express.Router();

  const handlers = [
    initPipeline(typology, path),
    multipartHandler,
    defaultHandler
  ];

  //
  router.post(/^(.*)$/, handlers, (req) => {
    req.pipeline.close();
  });

  return router;
};
