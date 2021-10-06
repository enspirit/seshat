import _ from 'lodash';
import express from 'express';
import fileUpload from './bucket/file-upload';
import fileRetrieve from './bucket/file-retrieve';
import fileList from './bucket/file-list';
import fileDelete from './bucket/file-delete';
import direntMiddleware from './bucket/dirent-mw';
import seshatActions from './bucket/actions';

import { DEFAULTS as defaultActions } from './bucket/actions';

const DEFAULTS = {
  uploadPage: true,
  lastModified: true,
  etag: true,
  cacheControl: 'private',
  actions: defaultActions,
};

export default (config) => {
  const router = express.Router();

  // Merge with defaults
  config = _.merge(DEFAULTS, config);

  if (config.middlewares) {
    const mw = config.middlewares ? [].concat(config.middlewares) : [];
    router.use(mw);
  }

  router.use(direntMiddleware(config));
  router.use('/', seshatActions(config));
  router.use('/', fileList(config));
  router.use('/', fileUpload(config));
  router.use('/', fileRetrieve(config));
  router.use('/', fileDelete(config));

  return router;
};
