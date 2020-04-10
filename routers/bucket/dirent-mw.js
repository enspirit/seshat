const {UnsecurePathError} = require('../../lib/robust/errors');

module.exports = ({storage}) => {
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
          res.header('Content-Type', 'text/plain');
          return res.sendStatus(404);
        }
        next(err);
      });
  };
};
