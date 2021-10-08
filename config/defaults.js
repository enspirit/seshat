import path from 'path';
import Typology from '../src/processors/typology';
import LocalStorage from '../src/storage/local';

const tmpStorage = new LocalStorage({
  dynamicTree: true,
  path: path.join(__dirname, '../tmp'),
});

export default {
  api: {
    port: 3000,
    cors: '*',
  },
  buckets: {
    '/simplest': {
      typology: new Typology()
        .add(Typology.renameSecure())
        .add(Typology.storage(tmpStorage)),
      storage: tmpStorage,
    },
  },
};
