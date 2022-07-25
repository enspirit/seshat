import { S3Client, ListObjectsV2Command, HeadObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

import S3Bucket from '../../src/s3/bucket';
import { ObjectNotFoundError, PrefixNotFoundError } from '../../src/errors';

import { expect, default as chai } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
chai.use(sinonChai);
import { mockClient } from 'aws-sdk-client-mock';
import { mockLibStorageUpload } from 'aws-sdk-client-mock/libStorage';

describe('S3Bucket', () => {

  const mockObjectA = {
    Key: 'package.json',
    ContentType: 'application/json',
  };

  const mockObjectB = {
    Key: 'README.txt',
    ContentType: 'plain/text',
  };

  let s3client: any;
  let bucket: S3Bucket;
  const bucketName = 'seshat-bucket';

  beforeEach(async () => {
    s3client = mockClient(S3Client);
    mockLibStorageUpload(s3client);

    s3client.on(HeadObjectCommand).resolves(mockObjectA);

    bucket = new S3Bucket({
      bucket: bucketName,
      s3client: s3client,
    });
  });

  describe('list()', () => {

    beforeEach(async () => {
      s3client.on(ListObjectsV2Command).resolves({ Contents: [mockObjectA, mockObjectB] });
    });

    it('uses the s3client properly (list object and head for each object)', async () => {
      await bucket.list();

      await expect(s3client.send).to.have.been.calledThrice;
      await expect(s3client.send).to.have.been.calledWith(sinon.match.instanceOf(ListObjectsV2Command));
      await expect(s3client.send).to.be.calledWith(sinon.match({
        input: {
          Bucket: 'seshat-bucket',
          Prefix: '',
          Delimiter: '/',
        },
      }));
      await expect(s3client.send).to.have.been.calledWith(sinon.match.instanceOf(HeadObjectCommand));
      await expect(s3client.send).to.have.been.calledWith(sinon.match({
        input: {
          Bucket: 'seshat-bucket',
          Key: 'package.json',
        },
      }));
      await expect(s3client.send).to.have.been.calledWith(sinon.match({
        input: {
          Bucket: 'seshat-bucket',
          Key: 'README.txt',
        },
      }));
    });

    it('uses the s3client properly (prefix arg provided)', async () => {
      await bucket.list('src/');
      await expect(s3client.send).to.have.been.calledWith(sinon.match.instanceOf(ListObjectsV2Command));
      await expect(s3client.send).to.be.calledWith(sinon.match({
        input: {
          Bucket: 'seshat-bucket',
          Prefix: 'src/',
          Delimiter: '/',
        },
      }));
    });

    it('returns the list of objects', async () => {
      const objects = await bucket.list();
      expect(objects.length).to.equal(2);
    });

    it('rejects properly if the prefix does not exist', async () => {
      s3client.on(ListObjectsV2Command).resolves({ Contents: [] });
      const p = bucket.list('/something/that/does/not/exist');
      await expect(p).to.be.rejectedWith(PrefixNotFoundError);
    });

  });

  describe('get()', () => {

    it('uses the s3client properly', async () => {
      await bucket.get('package.json');
      await expect(s3client.send).to.have.been.calledOnceWith(sinon.match.instanceOf(HeadObjectCommand));
      await expect(s3client.send).to.have.been.calledOnceWith(sinon.match({
        input: {
          Bucket: 'seshat-bucket',
          Key: 'package.json',
        },
      }));
    });

    it('returns a valid S3Object', async () => {
      const object = await bucket.get('package.json');
      expect(object.meta.name).to.equal('package.json');
      expect(object.meta.contentType).to.equal('application/json');
    });

    it('rejects properly when object does not exist', async () => {
      const error = new Error('NotFound') as any;
      error.name = 'NotFound';
      s3client.on(HeadObjectCommand).rejects(error);
      const p = bucket.get('package.json');
      await expect(p).to.be.rejectedWith(ObjectNotFoundError, /Object package.json not found/);
    });

  });

  // describe.only('put()', () => {

  //   beforeEach(async () => {
  //     // s3client.on(CreateMultipartUploadCommand).resolves({ UploadId: '1' });
  //     // s3client.on(UploadPartCommand).resolves({ ETag: '1' });
  //   });

  //   const metadata = { contentType: 'application/json' };

  //   it('uses the s3client properly', async () => {
  //     const readableStream = mockFileObject.getReadableStream();
  //     await bucket.put('test.json', await readableStream, metadata);
  //     await expect(s3client.send).to.be.calledWith(sinon.match.instanceOf(CreateMultipartUploadCommand));
  //     // await expect(s3client.send).to.be.calledOnceWith({
  //     //   Bucket: 'seshat-bucket',
  //     //   Key: 'test.json',
  //     //   ContentType: 'application/json',
  //     //   Body: readableStream,
  //     //   Metadata: {
  //     //     contentType: 'application/json',
  //     //   },
  //     // });
  //   });

  //   // it('returns a valid S3Object', async () => {
  //   //   const readableStream = mockFileObject.getReadableStream();
  //   //   const object = await bucket.put('test.json', readableStream, metadata);
  //   //   expect(object.name).to.equal('test.json');
  //   //   expect(object.contentType).to.equal('application/json');
  //   // });

  // });

  describe('delete()', () => {

    it('uses the s3client properly', async () => {
      await bucket.delete('package.json');
      await expect(s3client.send).to.be.calledWith(sinon.match.instanceOf(HeadObjectCommand));
      await expect(s3client.send).to.be.calledWith(sinon.match({
        input: {
          Bucket: 'seshat-bucket',
          Key: 'package.json',
        },
      }));
      await expect(s3client.send).to.be.calledWith(sinon.match.instanceOf(DeleteObjectCommand));
      await expect(s3client.send).to.be.calledWith(sinon.match({
        input: {
          Bucket: 'seshat-bucket',
          Key: 'package.json',
        },
      }));
    });

    it('rejects properly when object does not exist', async () => {
      const error = new Error('NotFound') as any;
      error.name = 'NotFound';
      s3client.on(HeadObjectCommand).rejects(error);
      const p = bucket.delete('test.json');
      await expect(p).to.be.rejectedWith(ObjectNotFoundError, /Object test.json not found/);
    });

  });

  describe('when created with a prefix option', () => {

    beforeEach(async () => {
      const objectsInSubfolder = [{
        Key: 'src/index.js',
        ContentType: 'application/javascript',
      }, {
        Key: 'src/example.js',
        ContentType: 'application/javascript',
      }];
      bucket = new S3Bucket({
        bucket: bucketName,
        s3client,
        prefix: 'src/',
      });
      s3client.on(ListObjectsV2Command).resolves({ Contents: objectsInSubfolder });
    });

    describe('list()', () => {

      it('uses the s3client properly (no arg provided)', async () => {
        await bucket.list();
        // eslint-disable-next-line no-unused-expressions
        expect(s3client.send).to.be.calledThrice;
        expect(s3client.send).to.be.calledWith(sinon.match.instanceOf(ListObjectsV2Command));
        expect(s3client.send).to.be.calledWith(sinon.match.instanceOf(HeadObjectCommand));
        expect(s3client.send).to.be.calledWith(sinon.match({
          input: {
            Bucket: 'seshat-bucket',
            Prefix: 'src/',
            Delimiter: '/',
          },
        }));
      });

      it('uses the s3client properly', async () => {
        await bucket.list('s3/');
        await expect(s3client.send).to.be.calledWith(sinon.match({
          input: {
            Bucket: 'seshat-bucket',
            Prefix: 'src/s3/',
            Delimiter: '/',
          },
        }));
      });

      it('returns s3object with proper names (prefix is removed)', async () => {
        const objects = await bucket.list();
        expect(objects).to.have.length(2);
        const [index, example] = objects;
        expect(index.meta.name).to.equal('index.js');
        expect(example.meta.name).to.equal('example.js');
      });

    });

  });
});
