import AbstractBucket from '../../src/bucket';
import { mockFileObject } from './object';
import * as sinon from 'sinon';

export const reset = () => {
  for (const meth of Object.getOwnPropertyNames(mockBucket)) {
    mockBucket[meth].reset();
  }
};

const mockBucket: AbstractBucket = {
  exists: sinon.stub().resolves(true),

  fileExists: sinon.stub().resolves(true),

  dirExists: sinon.stub().resolves(true),

  get: sinon.stub().resolves(mockFileObject),

  list: sinon.stub().resolves([mockFileObject]),

  delete: sinon.stub().resolves(),

  put: sinon.stub().resolves(),
};

export default mockBucket;
