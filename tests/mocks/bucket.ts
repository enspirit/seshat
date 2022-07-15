import AbstractBucket from '../../src/bucket';
import { mockFileObject } from './object';
import * as sinon from 'sinon';

export const reset = () => {
  (mockBucket.exists as sinon.SinonStub).reset();
  (mockBucket.fileExists as sinon.SinonStub).reset();
  (mockBucket.dirExists as sinon.SinonStub).reset();
  (mockBucket.get as sinon.SinonStub).reset();
};

const mockBucket: AbstractBucket = {
  exists: sinon.stub().resolves(true),

  fileExists: sinon.stub().resolves(true),

  dirExists: sinon.stub().resolves(true),

  get: sinon.stub().resolves(mockFileObject),

  list: sinon.stub().resolves([mockFileObject]),

  delete: sinon.stub().resolves(),
};

export default mockBucket;
