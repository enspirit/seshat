'use strict';

import path from 'path';
import Typology from '../src/processors/typology';
import LocalStorage from '../src/storage/local';
import GCSStorage from '../src/storage/gcs';

const gcsStorage = new GCSStorage({
  bucket: 'seshat',
  storageOptions: {
    projectId: 'seshat',
    apiEndpoint: 'http://fake-gcs-server:8080',
  },
});

const tmpStatic = new LocalStorage({
  dynamicTree: false,
  path: path.join(__dirname, '../tmp/local/simplest'),
});

const tmpDynamic = new LocalStorage({
  dynamicTree: true,
  path: path.join(__dirname, '../tmp/local/subfolders'),
});

const withOptionalProc = new LocalStorage({
  path: path.join(__dirname, '../tmp/local/optional'),
});

export default {
  api: {
    port: 3000,
    cors: '*',
  },
  buckets: {
    '/': null,
    '/gcs': {
      typology: new Typology()
        .add(Typology.renameSecure())
        .add(Typology.storage(gcsStorage)),
      storage: gcsStorage,
    },
    '/local/simplest': {
      typology: new Typology()
        .add(Typology.storage(tmpStatic)),
      storage: tmpStatic,
    },
    '/local/subfolders': {
      typology: new Typology()
        .add(Typology.renameSecure())
        .add(Typology.storage(tmpDynamic)),
      storage: tmpDynamic,
    },
    '/local/optional': {
      typology: new Typology()
        .add((req) => req.query.rename, Typology.renameSecure())
        .add(Typology.storage(withOptionalProc)),
      storage: withOptionalProc,
    },
  },
};
