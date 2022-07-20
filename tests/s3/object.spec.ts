import { expect } from 'chai';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
chai.use(chaiAsPromised);
chai.use(sinonChai);

import { default as S3, HeadObjectOutput } from 'aws-sdk/clients/s3';
import S3Object from '../../src/s3/object';

describe('S3Object', () => {

  let objectOutput: any;
  let s3client: Partial<S3>;
  const headObjectOutput: Partial<HeadObjectOutput> = {
    ContentType: 'plain/text',
  };
  let object: S3Object;

  beforeEach(() => {
    objectOutput = {
      createReadStream: sinon.stub(),
      createWriteStream: sinon.stub(),
    };
    s3client = {
      getObject: sinon.stub().returns(objectOutput),
    };
  });

  describe('.fromHeadOutput', () => {

    it('returns a valid S3Object', () => {
      object = S3Object.fromHeadOutput(s3client as S3, 'my-bucket', 'some/key.txt', headObjectOutput);
      expect(object.name).to.equal('some/key.txt');
      expect(object.isFile).to.equal(true);
    });

  });

  describe('.getReadableStream', () => {

    beforeEach(() => {
      object = S3Object.fromHeadOutput(s3client as S3, 'my-bucket', 'some/key.txt', headObjectOutput);
    });

    it('uses the s3client properly', () => {
      object.getReadableStream();
      expect(s3client.getObject).to.be.calledOnceWith({
        Bucket: 'my-bucket',
        Key: 'some/key.txt',
      });
      expect(objectOutput.createReadStream).to.be.calledOnceWith();
    });

  });

});
