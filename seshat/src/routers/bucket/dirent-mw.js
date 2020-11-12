import { UnsecurePathError } from '../../robust/errors';

export default ({storage}) => {
  return (req, res, next) => {
    const fpath = decodeURIComponent(req.path);
    storage.dirent(fpath)
      .then((dirent) => {
        req.dirent = dirent;
        req.dirent.name = fpath;
        next();
      })
      .catch((err) => {
        if (err instanceof UnsecurePathError) {
          res.header('Content-Type', 'text/plain');
          return res.status(403).send(err.message);
        }
        if (err.code === 'ENOENT') {
          return next();
        }
        next(err);
      });
  };
};
