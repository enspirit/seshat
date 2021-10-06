import express from 'express';

export default ({ storage }) => {
  const router = express.Router();

  router.delete(/^(.*)$/, (req, res) => {
    if (req.dirent.isDirectory()) {
      return res.status(405).send('DELETE on folders not supported');
    }
    storage.delete(req.dirent.name)
      .then(() => {
        return res.sendStatus(204);
      });
  });

  return router;
};
