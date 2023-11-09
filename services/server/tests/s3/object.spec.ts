import { expect } from 'chai';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinonChai from 'sinon-chai';
chai.use(chaiAsPromised);
chai.use(sinonChai);

import { GetObjectCommandOutput, HeadObjectCommandOutput } from '@aws-sdk/client-s3';
import { S3Object, S3ObjectMeta } from '../../src/';

describe('S3Object', () => {

  const headObjectOutput: Partial<HeadObjectCommandOutput> = {
    ContentType: 'plain/text',
  };
  const getObjectOutput: Partial<GetObjectCommandOutput> = {
    ContentType: 'plain/text',
  };
  let object: S3Object;
  let meta: S3ObjectMeta;

  beforeEach(() => {
  });

  describe('.metaFromCommandOutput', () => {

    it('returns a valid S3ObjectMeta', () => {
      meta = S3Object.metaFromCommandOutput('my-bucket', 'some/key.txt', headObjectOutput as HeadObjectCommandOutput);
      expect(meta.name).to.equal('some/key.txt');
    });

  });

  describe('.fromGetObjectCommandOutput', () => {

    it('returns a valid S3Object', () => {
      object = S3Object.fromGetObjectCommandOutput('my-bucket', 'some/key.txt', getObjectOutput as GetObjectCommandOutput);
      expect(object.meta.name).to.equal('some/key.txt');
    });

  });
});
