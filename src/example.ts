import path = require('path');
import { createApp } from './express';
import LocalBucket from './local/bucket';
import SeshatMiddlewares from './express/middlewares';
import { SeshatConfig } from './types';
import { Request, Response, NextFunction } from 'express';

const bucket = new LocalBucket(path.join(__dirname, '../'));
const config: SeshatConfig = {
  bucket,
  middlewares: SeshatMiddlewares,
};

const app = createApp(config);

app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(3000, () => {
  console.log('Seshat is running on http://localhost:3000');
});
