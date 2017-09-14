'use strict';

const {NotImplementedError} = require('../robust/errors');

class FileStorage {

  constructor(){}

  save(filestream, filename){
    throw new NotImplementedError('FileStorage#save not implemented');
  }

  get(filename){
    throw new NotImplementedError('FileStorage#get not implemented');
  }

  delete(filename){
    throw new NotImplementedError('FileStorage#delete not implemented');
  }

}

module.exports = FileStorage;
