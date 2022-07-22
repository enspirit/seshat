import { expect, default as chai } from 'chai';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';
import S3Bucket from '../../src/s3/bucket';
import { S3 } from 'aws-sdk';
chai.use(chaiAsPromised);
chai.use(sinonChai);

import { PrefixNotFoundError } from '../../src/errors';
import { mockFileObject } from '../mocks/object';
import { reset as resetMock, mockS3Client, mockEmptyListObjectV2Request, mockListObjectV2Request, listObjectsSubfolder } from './mocks/s3client';

describe('S3Bucket', () => {

  let bucket: S3Bucket;
  const bucketName = 'seshat-bucket';

  beforeEach(async () => {
    resetMock();
    bucket = new S3Bucket({
      bucket: bucketName,
      s3client: mockS3Client as S3,
    });
  });

  describe('list()', () => {

    it('uses the s3client properly (no arg provided)', async () => {
      await bucket.list();
      await expect(mockS3Client.listObjectsV2).to.be.calledOnceWith({
        Bucket: 'seshat-bucket',
        Prefix: '',
        Delimiter: '/',
      });
    });

    it('uses the s3client properly (prefix arg provided)', async () => {
      await bucket.list('src/');
      await expect(mockS3Client.listObjectsV2).to.be.calledOnceWith({
        Bucket: 'seshat-bucket',
        Prefix: 'src/',
        Delimiter: '/',
      });
    });

    it('returns the list of objects', async () => {
      const objects = await bucket.list();
      expect(objects.length).to.equal(2);
    });

    it('rejects properly if the prefix does not exist', async () => {
      (mockS3Client.listObjectsV2 as any).returns(mockEmptyListObjectV2Request);
      const p = bucket.list('/something/that/does/not/exist');
      await expect(p).to.be.rejectedWith(PrefixNotFoundError);
    });

  });

  describe('get()', () => {

    it('uses the s3client properly', async () => {
      await bucket.get('package.json');
      await expect(mockS3Client.headObject).to.be.calledOnceWith({
        Bucket: 'seshat-bucket',
        Key: 'package.json',
      });
    });

    it('returns a valid S3Object', async () => {
      const object = await bucket.get('package.json');
      expect(object.name).to.equal('package.json');
      expect(object.contentType).to.equal('application/json');
    });

    // it.skip('rejects properly when object does not exist', async () => {
    //   const error = new Error('NotFound') as AWSError;
    //   error.code = 'NotFound';
    //   mockHeadObjectResponse.promise.rejects(error);
    //   const p = bucket.get('package.json');
    //   await expect(p).to.be.rejectedWith(ObjectNotFoundError, /Object package.json not found/);
    // });

  });

  describe('put()', () => {

    const metadata = { mimeType: 'application/json' };

    it('uses the s3client properly', async () => {
      const readableStream = mockFileObject.getReadableStream();
      await bucket.put('test.json', readableStream, metadata);
      await expect(mockS3Client.upload).to.be.calledOnceWith({
        Bucket: 'seshat-bucket',
        Key: 'test.json',
        ContentType: 'application/json',
        Body: readableStream,
        Metadata: {
          mimeType: 'application/json',
        },
      });
    });

    it('returns a valid S3Object', async () => {
      const readableStream = mockFileObject.getReadableStream();
      const object = await bucket.put('test.json', readableStream, metadata);
      expect(object.name).to.equal('test.json');
      expect(object.contentType).to.equal('application/json');
    });

  });

  describe('delete()', () => {

    it('uses the s3client properly', async () => {
      await bucket.delete('package.json');
      await expect(mockS3Client.deleteObject).to.be.calledOnceWith({
        Bucket: 'seshat-bucket',
        Key: 'package.json',
      });
    });

    // it('rejects properly when object does not exist', async () => {
    //   const error = new Error('NotFound') as AWSError;
    //   error.code = 'NotFound';
    //   mockHeadObjectResponse.promise.rejects(error);
    //   const p = bucket.delete('test.json');
    //   await expect(p).to.be.rejectedWith(ObjectNotFoundError, /Object test.json not found/);
    // });

  });

  describe('when created with a prefix option', () => {

    beforeEach(async () => {
      bucket = new S3Bucket({
        bucket: bucketName,
        s3client: mockS3Client as S3,
        prefix: 'src/',
      });
      mockListObjectV2Request.promise.returns(listObjectsSubfolder);
    });

    describe('list()', () => {

      it('uses the s3client properly (no arg provided)', async () => {
        await bucket.list();
        expect(mockS3Client.listObjectsV2).to.be.calledOnceWith({
          Bucket: 'seshat-bucket',
          Prefix: 'src/',
          Delimiter: '/',
        });
      });

      it('uses the s3client properly', async () => {
        await bucket.list('s3/');
        await expect(mockS3Client.listObjectsV2).to.be.calledOnceWith({
          Bucket: 'seshat-bucket',
          Prefix: 'src/s3/',
          Delimiter: '/',
        });
      });

      it('returns s3object with proper names (prefix is removed)', async () => {
        const objects = await bucket.list();
        expect(objects).to.have.length(1);
        const [index] = objects;
        expect(index.name).to.equal('index.ts');
      });

    });

  });
});
