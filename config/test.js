'use strict';

import path from 'path';
import Typology from '../src/processors/typology';
import LocalStorage from '../src/storage/local';

const tmpStatic = new LocalStorage({
  dynamicTree: false,
  path: path.join(__dirname, '../tmp/simplest')
});

const tmpDynamic = new LocalStorage({
  dynamicTree: true,
  path: path.join(__dirname, '../tmp/subfolders')
});

const withOptionalProc = new LocalStorage({
  path: path.join(__dirname, '../tmp/optional')
});

export default {
  api: {
    port: 3000,
    cors: '*'
  },
  buckets: {
    '/': null,
    '/simplest': {
      typology: new Typology()
        .add(Typology.storage(tmpStatic)),
      storage: tmpStatic
    },
    '/subfolders': {
      typology: new Typology()
        .add(Typology.renameSecure())
        .add(Typology.storage(tmpDynamic)),
      storage: tmpDynamic
    },
    '/optional': {
      typology: new Typology()
        .add((req) => req.query.rename, Typology.renameSecure())
        .add(Typology.storage(withOptionalProc)),
      storage: withOptionalProc
    }
  }
};
