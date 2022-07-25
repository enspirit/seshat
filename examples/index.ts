import express, { NextFunction, Request, Response } from 'express';

import localExample from './local';
import s3example from './s3';
import gzipExample from './gzip';

const app = express();

// Mount all examples
[
  localExample,
  s3example,
  gzipExample,
].forEach((example) => example(app));

/**
 * Error logging
 */
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(3000, () => {
  console.log('Seshat is running on http://localhost:3000');
});
