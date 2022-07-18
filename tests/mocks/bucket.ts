import AbstractBucket from '../../src/bucket';
import { mockFileObject } from './object';
import { Readable } from 'stream';
import * as fs from 'fs';
import * as sinon from 'sinon';
import { SeshatObject } from '../../src/types';

export const reset = () => {
  for (const meth of Object.getOwnPropertyNames(mockBucket)) {
    mockBucket[meth].resetHistory();
  }
};

const fakeBucket = {
  put: async (fpath: string, readable: Readable): Promise<SeshatObject> => {
    const devNull = fs.createWriteStream('/dev/null');
    readable.pipe(devNull);
    return mockFileObject;
  },
};

const mockBucket: AbstractBucket = {
  exists: sinon.stub().resolves(true),

  fileExists: sinon.stub().resolves(true),

  dirExists: sinon.stub().resolves(true),

  get: sinon.stub().resolves(mockFileObject),

  list: sinon.stub().resolves([mockFileObject]),

  delete: sinon.stub().resolves(),

  put: sinon.spy(fakeBucket, 'put'),
};

export default mockBucket;
