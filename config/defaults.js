'use strict';

const path = require('path');
const Typology = require('../lib/processors/typology');

const tmpStorage = Typology.localStorage(path.join(__dirname, '../tmp'));

module.exports = {
  api: {
    port: 3000,
    cors: '*'
  },
  buckets: {
    '/': {
      typology: new Typology()
        .add(Typology.renameSecure())
        .add(tmpStorage),
      storage: tmpStorage
    }
  }
};
