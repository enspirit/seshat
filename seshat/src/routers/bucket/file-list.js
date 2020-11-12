import express from 'express';
import path from 'path';

export default ({storage, ...config}) => {
  const router = express.Router();

  router.get(/^(.*)$/, (req, res, next) => {
    if (!req.dirent || !req.dirent.isDirectory()) {
      return next();
    }
    res.format({
      json: () => {
        storage.list(req.dirent.name)
          .then((list) => res.send(list));
      },
      html: () => {
        if (config.uploadPage) {
          return res.sendFile(path.join(__dirname, './index.html'));
        }
        return res.status(404).send('Not found');
      },
      default: () => {
        return res.status(406).send('Format not supported');
      }
    });
  });

  return router;
};
