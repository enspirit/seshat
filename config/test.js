'use strict';

const path = require('path');
const Typology = require('../lib/processors/typology');
const LocalStorage = require('../lib/storage/local');

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

module.exports = {
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
