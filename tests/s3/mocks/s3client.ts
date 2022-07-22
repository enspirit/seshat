import { AWSError, S3 } from 'aws-sdk';
import sinon from 'sinon';

export const emptyListObjects = {
  Contents: [],
};

export const mockObject = {
  ContentType: 'application/json',
};

export const listObjects = {
  Contents: [
    {
      Key: 'README.md',
    },
    {
      Key: 'package.json',
    },
  ],
};

export const listObjectsSubfolder = {
  Contents: [
    {
      Key: 'src/index.ts',
    },
  ],
};

export const mockListObjectV2Request = {
  promise: sinon.stub().resolves(listObjects),
};

export const mockEmptyListObjectV2Request = {
  promise: sinon.stub().resolves(emptyListObjects),
};

export const mockHeadObjectResponse = {
  promise: sinon.stub().resolves(mockObject),
};

export const mockUploadResponse = {
  promise: sinon.stub().resolves(listObjects),
};

export const mockDeleteResponse = {
  promise: sinon.stub().resolves(true),
};

const NotFoundError = new Error('NotFound') as AWSError;
NotFoundError.code = 'NotFound';

export const reset = () => {
  const mock = mockS3Client as any;
  mock.listObjectsV2 = sinon.stub().returns(mockListObjectV2Request);
  mock.headObject = sinon.stub().returns(mockHeadObjectResponse);
  mock.upload = sinon.stub().returns(mockUploadResponse);
  mock.deleteObject = sinon.stub().returns(mockDeleteResponse);
};

export const mockS3Client: Partial<S3> = {

  listObjectsV2: sinon.stub().returns(mockListObjectV2Request),
  headObject: sinon.stub().returns(mockHeadObjectResponse),
  upload: sinon.stub().returns(mockUploadResponse),
  deleteObject: sinon.stub().returns(mockDeleteResponse),

};

