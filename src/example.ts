import path = require('path');
import { createApp } from './express';
import LocalBucket from './local/bucket';

const bucket = new LocalBucket(path.join(__dirname, '../../'));
const app = createApp(bucket);

app.listen(3000);
