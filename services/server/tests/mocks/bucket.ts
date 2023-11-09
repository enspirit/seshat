import { getMockFileObject } from './object';
import { Readable } from 'stream';
import * as fs from 'fs';
import { SinonStub, SinonSpy, default as sinon } from 'sinon';
import { ObjectMeta } from '@enspirit/seshat-commons';

interface MockBucket {
  exists: SinonStub,
  fileExists: SinonStub,
  dirExists: SinonStub,
  head: SinonStub,
  get: SinonStub,
  list: SinonStub,
  mkdir: SinonStub,
  delete: SinonStub,
  put: SinonSpy
  on: SinonSpy
  off: SinonSpy
  emit: SinonSpy
}

export const getMockBucket = (): MockBucket => {

  const fakeBucket = {
    put: async (readable: Readable, _meta: ObjectMeta): Promise<ObjectMeta> => {
      const devNull = fs.createWriteStream('/dev/null');
      readable.pipe(devNull);
      return getMockFileObject().meta;
    },
  };

  return {
    exists: sinon.stub().resolves(true),

    fileExists: sinon.stub().resolves(true),

    dirExists: sinon.stub().resolves(true),

    get: sinon.stub().resolves(getMockFileObject()),

    head: sinon.stub().resolves(getMockFileObject().meta),

    list: sinon.stub().resolves([getMockFileObject()]),

    mkdir: sinon.stub().resolves(),

    delete: sinon.stub().resolves(),

    put: sinon.spy(fakeBucket, 'put'),

    // EventEmitter
    on: sinon.stub().resolves(),
    off: sinon.stub().resolves(),
    emit: sinon.stub().resolves(),
  };
};
