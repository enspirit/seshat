import path = require('path');
import { createApp } from './express';
import LocalBucket from './local/bucket';
import SeshatMiddlewares from './express/middlewares';
import SeshatActions from './actions';
import { SeshatConfig } from './types';

const bucket = new LocalBucket(path.join(__dirname, '../'));
const actions = SeshatActions.map(clazz => new clazz());
const config: SeshatConfig = {
  bucket,
  actions,
  middlewares: SeshatMiddlewares,
};

const app = createApp(config);

app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(3000, () => {
  console.log('Seshat is running on http://localhost:3000');
});
