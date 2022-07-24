import { mockFileObject } from './object';
import { Readable } from 'stream';
import * as fs from 'fs';
import { SinonStub, SinonSpy, default as sinon } from 'sinon';
import { SeshatBucket, SeshatObject, SeshatObjectMeta } from '../../src/types';

export const reset = () => {
  mockBucket.exists.resetHistory();
  mockBucket.fileExists.resetHistory();
  mockBucket.dirExists.resetHistory();
  mockBucket.get.resetHistory();
  mockBucket.list.resetHistory();
  mockBucket.delete.resetHistory();
  mockBucket.put.resetHistory();
};

const fakeBucket = {
  put: async (readable: Readable, _meta: SeshatObjectMeta): Promise<SeshatObject> => {
    const devNull = fs.createWriteStream('/dev/null');
    readable.pipe(devNull);
    return mockFileObject;
  },
};

interface MockBucket {
  exists: SinonStub,
  fileExists: SinonStub,
  dirExists: SinonStub,
  get: SinonStub,
  list: SinonStub,
  delete: SinonStub,
  put: SinonSpy
}

const mockBucket: MockBucket = {
  exists: sinon.stub().resolves(true),

  fileExists: sinon.stub().resolves(true),

  dirExists: sinon.stub().resolves(true),

  get: sinon.stub().resolves(mockFileObject),

  list: sinon.stub().resolves([mockFileObject]),

  delete: sinon.stub().resolves(),

  put: sinon.spy(fakeBucket, 'put'),
};

export default mockBucket as SeshatBucket;
