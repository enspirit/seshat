import * as express from 'express';

export const createMiddleware = (): express.Express => {
  const bucket = express();

  bucket.get('/:file', (req, res) => {
    res.sendStatus(404);
  });

  return bucket;
};
