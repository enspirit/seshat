import { expect, default as chai } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';
import S3Bucket from '../../src/s3/bucket';
chai.use(chaiAsPromised);
chai.use(sinonChai);

import { ObjectNotFoundError, PrefixNotFoundError } from '../../src/errors';
import { mockFileObject } from '../mocks/object';
import { client as s3client, ensureS3Object, ensureNoS3Object, ensureS3BucketEmpty } from './helpers';

describe('S3Bucket', () => {

  let bucket: S3Bucket;
  const bucketName = 'seshat-bucket';

  beforeEach(async () => {
    bucket = new S3Bucket({
      bucket: bucketName,
      s3client,
    });
  });

  describe('list()', () => {

    beforeEach(async () => {
      await ensureS3BucketEmpty();
      await ensureS3Object('package.json');
      await ensureS3Object('README.md');
      await ensureS3Object('src/index.ts');
    });

    it('uses the s3client properly (no arg provided)', async () => {
      const spy = sinon.spy(s3client, 'listObjectsV2');
      await bucket.list();
      await expect(spy).to.be.calledOnceWith({
        Bucket: 'seshat-bucket',
        Prefix: '',
        Delimiter: '/',
      });

      spy.restore();
    });

    it('uses the s3client properly (prefix arg provided)', async () => {
      const spy = sinon.spy(s3client, 'listObjectsV2');
      await bucket.list('src/');
      await expect(spy).to.be.calledOnceWith({
        Bucket: 'seshat-bucket',
        Prefix: 'src/',
        Delimiter: '/',
      });

      spy.restore();
    });

    it('returns the list of objects (no arg provided)', async () => {
      const objects = await bucket.list();
      expect(objects.length).to.equal(2);
      const packageJson = objects.find(o => o.name === 'package.json');
      // eslint-disable-next-line no-unused-expressions
      expect(packageJson).to.exist;
      expect(packageJson?.contentType).to.equal('application/json');
      const readmeMd = objects.find(o => o.name === 'README.md');
      // eslint-disable-next-line no-unused-expressions
      expect(readmeMd).to.exist;
      expect(readmeMd?.contentType).to.equal('text/markdown');
    });

    it('returns the list of objects (with prefix arg provided)', async () => {
      const objects = await bucket.list('src/');
      expect(objects.length).to.equal(1);
      const indexTsFile = objects.find(o => o.name === 'src/index.ts');
      // eslint-disable-next-line no-unused-expressions
      expect(indexTsFile).to.exist;
    });

    it('rejects properly if the prefix does not exist', async () => {
      const p = bucket.list('/something/that/does/not/exist');
      await expect(p).to.be.rejectedWith(PrefixNotFoundError);
    });

  });

  describe('get()', () => {

    it('uses the s3client properly', async () => {
      await ensureS3Object('package.json');

      const spy = sinon.spy(s3client, 'headObject');
      await bucket.get('package.json');
      await expect(spy).to.be.calledOnceWith({
        Bucket: 'seshat-bucket',
        Key: 'package.json',
      });

      spy.restore();
    });

    it('returns a valid S3Object', async () => {
      await ensureS3Object('package.json');

      const object = await bucket.get('package.json');
      expect(object.name).to.equal('package.json');
      expect(object.contentType).to.equal('application/json');
    });

    it('rejects properly when object does not exist', async () => {
      await ensureNoS3Object('test.json');

      const p = bucket.get('test.json');
      await expect(p).to.be.rejectedWith(ObjectNotFoundError, /Object test.json not found/);
    });

  });

  describe('put()', () => {

    const metadata = { mimeType: 'application/json' };
    beforeEach(async () => {
      await ensureNoS3Object('test.json');
    });

    it('uses the s3client properly', async () => {
      const readableStream = mockFileObject.getReadableStream();
      const spy = sinon.spy(s3client, 'upload');
      await bucket.put('test.json', readableStream, metadata);
      await expect(spy).to.be.calledOnceWith({
        Bucket: 'seshat-bucket',
        Key: 'test.json',
        ContentType: 'application/json',
        Body: readableStream,
        Metadata: {
          mimeType: 'application/json',
        },
      });

      spy.restore();
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
      await ensureS3Object('package.json');

      const spy = sinon.spy(s3client, 'deleteObject');
      await bucket.delete('package.json');
      await expect(spy).to.be.calledOnceWith({
        Bucket: 'seshat-bucket',
        Key: 'package.json',
      });

      spy.restore();
    });

    it('succeeds for existing objects', async () => {
      await ensureS3Object('package.json');

      await bucket.delete('package.json');
    });

    it('rejects properly when object does not exist', async () => {
      await ensureNoS3Object('test.json');

      const p = bucket.delete('test.json');
      await expect(p).to.be.rejectedWith(ObjectNotFoundError, /Object test.json not found/);
    });

  });

  describe('when created with a prefix option', () => {

    beforeEach(async () => {
      bucket = new S3Bucket({
        bucket: bucketName,
        s3client,
        prefix: 'src/',
      });

      await ensureS3BucketEmpty();
      await ensureS3Object('src/index.ts');
      await ensureS3Object('src/s3/bucket.ts');
    });

    describe('list()', () => {

      it('uses the s3client properly (no arg provided)', async () => {
        const spy = sinon.spy(s3client, 'listObjectsV2');
        await bucket.list();
        expect(spy).to.be.calledOnceWith({
          Bucket: 'seshat-bucket',
          Prefix: 'src/',
          Delimiter: '/',
        });
        spy.restore();
      });

      it('uses the s3client properly (prefix arg provided)', async () => {
        const spy = sinon.spy(s3client, 'listObjectsV2');
        await bucket.list('s3/');
        await expect(spy).to.be.calledOnceWith({
          Bucket: 'seshat-bucket',
          Prefix: 'src/s3/',
          Delimiter: '/',
        });

        spy.restore();
      });

      it('returns s3object with proper names (no arg provided)', async () => {
        const objects = await bucket.list();
        expect(objects).to.have.length(1);
        const [index] = objects;
        expect(index.name).to.equal('index.ts');
      });

      it('returns s3object with proper names (prefix provided)', async () => {
        const objects = await bucket.list('s3/');
        expect(objects).to.have.length(1);
        const [bucketTs] = objects;
        expect(bucketTs.name).to.equal('s3/bucket.ts');
      });
    });

  });
});
