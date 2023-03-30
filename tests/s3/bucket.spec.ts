import { S3Client, ListObjectsV2Command, HeadObjectCommand, DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

import { Object, ObjectMeta, S3Bucket } from '../../src/';
import { ObjectNotFoundError, PrefixNotFoundError } from '../../src/errors';

import { expect, default as chai } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
chai.use(sinonChai);
import { mockClient } from 'aws-sdk-client-mock';
import { mockLibStorageUpload } from 'aws-sdk-client-mock/libStorage';
import { getMockFileObject } from '../mocks/object';

describe('S3Bucket', () => {

  const mockObjectA = {
    Key: 'package.json',
    ContentType: 'application/json',
    Metadata: {
      foo: 'bar',
    },
  };

  const mockObjectB = {
    Key: 'README.txt',
    ContentType: 'plain/text',
  };

  let s3mock: any;
  let s3client: S3Client;
  let bucket: S3Bucket;
  let mockFileObject: Object;
  const bucketName = 'seshat-bucket';

  beforeEach(async () => {
    mockFileObject = getMockFileObject();
    s3mock = mockClient(S3Client);
    s3client = new S3Client({ region: 'eu-west1' });
    mockLibStorageUpload(s3mock);

    s3mock.on(HeadObjectCommand).resolves(mockObjectA);
    s3mock.on(GetObjectCommand).resolves(mockObjectA);

    bucket = new S3Bucket({
      bucket: bucketName,
      s3client: s3client,
    });
  });

  describe('list()', () => {

    beforeEach(async () => {
      s3mock.on(ListObjectsV2Command).resolves({ Contents: [mockObjectA, mockObjectB] });
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
      s3mock.on(ListObjectsV2Command).resolves({ Contents: [] });
      const p = bucket.list('/something/that/does/not/exist');
      await expect(p).to.be.rejectedWith(PrefixNotFoundError);
    });

  });

  describe('get()', () => {

    it('uses the s3client properly', async () => {
      await bucket.get('package.json');
      await expect(s3client.send).to.have.been.calledOnceWith(sinon.match.instanceOf(GetObjectCommand));
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

    it('includes extra object meta when present', async () => {
      const object = await bucket.get('package.json');
      expect(object.meta.name).to.equal('package.json');
      expect(object.meta.contentType).to.equal('application/json');
      expect(object.meta.foo).to.equal('bar');
    });

    it('rejects properly when object does not exist', async () => {
      const error = new Error('NotFound') as any;
      error.name = 'NotFound';
      s3mock.on(GetObjectCommand).rejects(error);
      const p = bucket.get('package.json');
      await expect(p).to.be.rejectedWith(ObjectNotFoundError, /Object package.json not found/);
    });

  });

  describe('put()', () => {

    let metadata: ObjectMeta;
    beforeEach(async () => {
      // s3mock.on(CreateMultipartUploadCommand).resolves({ UploadId: '1' });
      // s3mock.on(UploadPartCommand).resolves({ ETag: '1' });
      metadata = { name: 'test.json', contentType: 'application/json' };
    });

    it('uses the s3client properly (simple upload)', async () => {
      await bucket.put(mockFileObject.body, metadata);
      await expect(s3client.send).to.be.calledWith(sinon.match.instanceOf(PutObjectCommand));
      await expect(s3client.send).to.be.calledWith(sinon.match({
        input: {
          Bucket: 'seshat-bucket',
          Key: 'test.json',
          ContentType: 'application/json',
          Metadata: {
          },
        },
      }));
    });

    it('stores additional metadata props accordingly', async () => {
      metadata.foo = 'bar';
      await bucket.put(mockFileObject.body, metadata);
      await expect(s3client.send).to.be.calledWith(sinon.match.instanceOf(PutObjectCommand));
      await expect(s3client.send).to.be.calledWith(sinon.match({
        input: {
          Bucket: 'seshat-bucket',
          Key: 'test.json',
          ContentType: 'application/json',
          Metadata: {
            foo: 'bar',
          },
        },
      }));
    });

    // Some S3 servers don't handle non-ascii chars very well
    it('ensures metadata props are url safe', async () => {
      metadata.originalname = 'é ç à Z.png';
      await bucket.put(mockFileObject.body, metadata);
      await expect(s3client.send).to.be.calledWith(sinon.match.instanceOf(PutObjectCommand));
      await expect(s3client.send).to.be.calledWith(sinon.match({
        input: {
          Bucket: 'seshat-bucket',
          Key: 'test.json',
          ContentType: 'application/json',
          Metadata: {
            originalname: 'e%CC%81%20c%CC%A7%20a%CC%80%20Z.png',
          },
        },
      }));
    });

    it('returns a valid S3Object', async () => {
      const objectMeta = await bucket.put(mockFileObject.body, metadata);
      expect(objectMeta.name).to.equal('test.json');
      expect(objectMeta.contentType).to.equal('application/json');
    });
  });

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
      s3mock.on(HeadObjectCommand).rejects(error);
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
      s3mock.on(ListObjectsV2Command).resolves({ Contents: objectsInSubfolder });
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

      it('returns s3object meta, sorted, and with proper names (prefix is removed)', async () => {
        const metas = await bucket.list();
        expect(metas).to.have.length(2);
        const [example, index] = metas;
        expect(example.name).to.equal('example.js');
        expect(index.name).to.equal('index.js');
      });

    });

  });
});
