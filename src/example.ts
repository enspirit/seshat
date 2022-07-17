import path = require('path');
import { createApp } from './express';
import LocalBucket from './local/bucket';

const bucket = new LocalBucket(path.join(__dirname, '../../'));
const config = {
  bucket,
};
const app = createApp(config);

app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(3000);
