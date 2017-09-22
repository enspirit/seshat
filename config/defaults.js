'use strict';

const path = require('path');
const Typology = require('../lib/processors/typology');
const LocalStorage = require('../lib/storage/local');

const tmpStorage = new LocalStorage({
  path: path.join(__dirname, '../tmp')
});

module.exports = {
  api: {
    port: 3000,
    cors: '*'
  },
  buckets: {
    '/': {
      typology: new Typology()
        .add(Typology.renameSecure())
        .add(Typology.storage(tmpStorage)),
      storage: tmpStorage
    }
  }
};
