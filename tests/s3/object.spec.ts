import { expect } from 'chai';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
chai.use(chaiAsPromised);
chai.use(sinonChai);

import { GetObjectCommand, HeadObjectCommandOutput, S3Client } from '@aws-sdk/client-s3';
import S3Object from '../../src/s3/object';

describe('S3Object', () => {

  let objectOutput: any;
  let s3client: Partial<S3Client>;
  const headObjectOutput: Partial<HeadObjectCommandOutput> = {
    ContentType: 'plain/text',
  };
  let object: S3Object;

  beforeEach(() => {
    objectOutput = {
      createReadStream: sinon.stub(),
      createWriteStream: sinon.stub(),
    };
    s3client = {
      send: sinon.stub().returns(objectOutput),
    };
  });

  describe('.fromHeadOutput', () => {

    it('returns a valid S3Object', () => {
      object = S3Object.fromHeadOutput(s3client as S3Client, 'my-bucket', 'some/key.txt', headObjectOutput as HeadObjectCommandOutput);
      expect(object.meta.name).to.equal('some/key.txt');
    });

  });

  describe('.getReadableStream', () => {

    beforeEach(() => {
      object = S3Object.fromHeadOutput(s3client as S3Client, 'my-bucket', 'some/key.txt', headObjectOutput as HeadObjectCommandOutput);
    });

    it('uses the s3client properly', () => {
      object.getReadableStream();
      expect(s3client.send).to.be.calledOnceWith(sinon.match.instanceOf(GetObjectCommand));
      expect(s3client.send).to.be.calledOnceWith(sinon.match({
        input: {
          Bucket: 'my-bucket',
          Key: 'some/key.txt',
        },
      }));
    });

  });

});
