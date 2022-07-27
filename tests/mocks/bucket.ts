import { getMockFileObject } from './object';
import { Readable } from 'stream';
import * as fs from 'fs';
import { SinonStub, SinonSpy, default as sinon } from 'sinon';
import { Object, ObjectMeta } from '../../src/types';

interface MockBucket {
  exists: SinonStub,
  fileExists: SinonStub,
  dirExists: SinonStub,
  head: SinonStub,
  get: SinonStub,
  list: SinonStub,
  delete: SinonStub,
  put: SinonSpy
}

export const getMockBucket = (): MockBucket => {

  const fakeBucket = {
    put: async (readable: Readable, _meta: ObjectMeta): Promise<Object> => {
      const devNull = fs.createWriteStream('/dev/null');
      readable.pipe(devNull);
      return getMockFileObject();
    },
  };

  return {
    exists: sinon.stub().resolves(true),

    fileExists: sinon.stub().resolves(true),

    dirExists: sinon.stub().resolves(true),

    get: sinon.stub().resolves(getMockFileObject()),

    head: sinon.stub().resolves(getMockFileObject().meta),

    list: sinon.stub().resolves([getMockFileObject()]),

    delete: sinon.stub().resolves(),

    put: sinon.spy(fakeBucket, 'put'),
  };
};
