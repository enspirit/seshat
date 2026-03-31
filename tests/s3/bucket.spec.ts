import { S3Client, ListObjectsV2Command, HeadObjectCommand, DeleteObjectCommand, GetObjectCommand, PutObjectCommand, CreateMultipartUploadCommand, UploadPartCommand } from '@aws-sdk/client-s3';

import { type Object, type ObjectMeta, S3Bucket } from '../../src/index.js';
import { ObjectNotFoundError, PrefixNotFoundError } from '../../src/errors.js';

import { expect } from 'chai';
import { mockClient } from 'aws-sdk-client-mock';
import { getMockFileObject } from '../mocks/object.js';

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
    s3mock.on(PutObjectCommand).resolves({});
    s3mock.on(CreateMultipartUploadCommand).resolves({ UploadId: '1' });
    s3mock.on(UploadPartCommand).resolves({ ETag: '1' });

    s3mock.on(HeadObjectCommand).resolves(mockObjectA);
    s3mock.on(GetObjectCommand).resolves(mockObjectA);

    bucket = new S3Bucket({
      bucket: bucketName,
      s3client: s3client,
    });
  });

  afterEach(() => {
    s3mock.restore();
  });

  describe('list()', () => {

    beforeEach(async () => {
      s3mock.on(ListObjectsV2Command).resolves({ Contents: [mockObjectA, mockObjectB] });
    });

    it('uses the s3client properly (list object and head for each object)', async () => {
      await bucket.list();

      expect(s3mock.calls()).to.have.length(3);
      expect(s3mock.commandCalls(ListObjectsV2Command)).to.have.length(1);
      expect(s3mock.commandCalls(ListObjectsV2Command, {
        Bucket: 'seshat-bucket',
        Prefix: '',
        Delimiter: '/',
      })).to.have.length(1);
      expect(s3mock.commandCalls(HeadObjectCommand)).to.have.length(2);
      expect(s3mock.commandCalls(HeadObjectCommand, {
        Bucket: 'seshat-bucket',
        Key: 'package.json',
      })).to.have.length(1);
      expect(s3mock.commandCalls(HeadObjectCommand, {
        Bucket: 'seshat-bucket',
        Key: 'README.txt',
      })).to.have.length(1);
    });

    it('uses the s3client properly (prefix arg provided)', async () => {
      await bucket.list('src/');
      expect(s3mock.commandCalls(ListObjectsV2Command)).to.have.length(1);
      expect(s3mock.commandCalls(ListObjectsV2Command, {
        Bucket: 'seshat-bucket',
        Prefix: 'src/',
        Delimiter: '/',
      })).to.have.length(1);
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
      expect(s3mock.commandCalls(GetObjectCommand)).to.have.length(1);
      expect(s3mock.commandCalls(GetObjectCommand, {
        Bucket: 'seshat-bucket',
        Key: 'package.json',
      })).to.have.length(1);
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
      metadata = { name: 'test.json', contentType: 'application/json' };
    });

    it('uses the s3client properly (simple upload)', async () => {
      await bucket.put(mockFileObject.body, metadata);
      expect(s3mock.commandCalls(PutObjectCommand)).to.have.length(1);
      const call = s3mock.commandCalls(PutObjectCommand)[0];
      expect(call.args[0].input).to.deep.include({
        Bucket: 'seshat-bucket',
        Key: 'test.json',
        ContentType: 'application/json',
      });
      expect(call.args[0].input.Metadata).to.deep.equal({});
    });

    it('stores additional metadata props accordingly', async () => {
      metadata.foo = 'bar';
      await bucket.put(mockFileObject.body, metadata);
      expect(s3mock.commandCalls(PutObjectCommand)).to.have.length(1);
      const call = s3mock.commandCalls(PutObjectCommand)[0];
      expect(call.args[0].input).to.deep.include({
        Bucket: 'seshat-bucket',
        Key: 'test.json',
        ContentType: 'application/json',
      });
      expect(call.args[0].input.Metadata).to.deep.equal({ foo: 'bar' });
    });

    // Some S3 servers don't handle non-ascii chars very well
    it('ensures metadata props are url safe', async () => {
      metadata.originalname = 'é ç à Z.png';
      await bucket.put(mockFileObject.body, metadata);
      expect(s3mock.commandCalls(PutObjectCommand)).to.have.length(1);
      const call = s3mock.commandCalls(PutObjectCommand)[0];
      expect(call.args[0].input).to.deep.include({
        Bucket: 'seshat-bucket',
        Key: 'test.json',
        ContentType: 'application/json',
      });
      expect(call.args[0].input.Metadata).to.deep.equal({
        originalname: '%C3%A9%20%C3%A7%20%C3%A0%20Z.png',
      });
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
      expect(s3mock.commandCalls(HeadObjectCommand, {
        Bucket: 'seshat-bucket',
        Key: 'package.json',
      })).to.have.length(1);
      expect(s3mock.commandCalls(DeleteObjectCommand, {
        Bucket: 'seshat-bucket',
        Key: 'package.json',
      })).to.have.length(1);
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
        expect(s3mock.calls()).to.have.length(3);
        expect(s3mock.commandCalls(ListObjectsV2Command)).to.have.length(1);
        expect(s3mock.commandCalls(HeadObjectCommand)).to.have.length(2);
        expect(s3mock.commandCalls(ListObjectsV2Command, {
          Bucket: 'seshat-bucket',
          Prefix: 'src/',
          Delimiter: '/',
        })).to.have.length(1);
      });

      it('uses the s3client properly', async () => {
        await bucket.list('s3/');
        expect(s3mock.commandCalls(ListObjectsV2Command, {
          Bucket: 'seshat-bucket',
          Prefix: 'src/s3/',
          Delimiter: '/',
        })).to.have.length(1);
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
