import path from 'path';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { LocalBucket } from '../../src/';
chai.use(chaiAsPromised);

import { expect } from 'chai';
import { ObjectNotFoundError, PrefixNotFoundError } from '../../src/errors';
import { mockFileObject } from '../mocks/object';
import { Object, Bucket } from '../../src/types';

describe('LocalBucket', () => {

  let bucket: Bucket;
  beforeEach(() => {
    bucket = new LocalBucket({ path: path.join(__dirname, '../../') });
  });

  describe('list()', () => {

    it('resolves the correct list of objects (no param)', async () => {
      const metas = await bucket.list();
      const packageJson = metas.find(m => m.name === 'package.json');
      // eslint-disable-next-line no-unused-expressions
      expect(packageJson).to.exist;
    });

    it('resolves the correct list of objects (src/)', async () => {
      const metas = await bucket.list('src/');
      const indexTs = metas.find(m => m.name === 'src/index.ts');
      // eslint-disable-next-line no-unused-expressions
      expect(indexTs).to.exist;
    });

    it('rejects if the prefix/folder does not exist', () => {
      const promise = bucket.list('unknown/');
      return expect(promise).to.be.rejectedWith(PrefixNotFoundError);
    });

  });

  describe('get()', () => {

    it('resolves the correct fstat information', async () => {
      const stat = await bucket.get('package.json');
      expect(stat.meta.name).to.equal('package.json');
      expect(stat.meta.contentType).to.equal('application/json');
    });

    it('resolves the correct fstat information (file in subfolder)', async () => {
      const stat = await bucket.get('src/index.ts');
      expect(stat.meta.name).to.equal('src/index.ts');
    });

    it('rejects if file does not exist', () => {
      const promise = bucket.get('unknown.file');
      return expect(promise).to.be.rejectedWith(ObjectNotFoundError);
    });

    it('rejects if path matches a folder', () => {
      const promise = bucket.get('tmp/');
      return expect(promise).to.be.rejectedWith(ObjectNotFoundError);
    });

    it('rejects if path goes out of bucket', () => {
      const promise = bucket.get('../../../file.txt');
      return expect(promise).to.be.rejectedWith(/Relative paths are not allowed/);
    });

    it('accepts relative path while they remain in bucket', async () => {
      const promise = bucket.get('src/local/../index.ts');
      await expect(promise).to.not.be.rejected;
      const object = await promise;
      expect(object.meta.name).to.equal('src/index.ts');
    });

  });

  describe('exists()', () => {
    it('resolves true for existing files', async () => {
      expect(await bucket.exists('package.json')).to.equal(true);
      expect(await bucket.exists('src/index.ts')).to.equal(true);
    });

    it('resolves false for folders', async () => {
      expect(await bucket.exists('src/')).to.equal(false);
      expect(await bucket.exists('src/local')).to.equal(false);
    });

    it('resolves false for unknown files', async () => {
      expect(await bucket.exists('unknown.json')).to.equal(false);
      expect(await bucket.exists('unknown/something')).to.equal(false);
      expect(await bucket.exists('src/unknown.js')).to.equal(false);
    });
  });

  describe('put()', () => {

    it('resolves with the object created', async () => {
      const meta = { name: 'tmp/test.json', contentType: mockFileObject.meta.contentType };
      const object = await bucket.put(mockFileObject.body, meta);
      expect(object.meta.name).to.equal('tmp/test.json');
      expect(object.meta.contentType).to.equal('application/json');
    });

    it('rejects if path goes out of bucket', async () => {
      const meta = { name: '../../../file.txt', contentType: mockFileObject.meta.contentType };
      const promise = bucket.put(mockFileObject.body, meta);
      return expect(promise).to.be.rejectedWith(/Relative paths are not allowed/);
    });

    it('accepts relative path while they remain in bucket', async () => {
      const meta = { name: 'tmp/subfolder/../index.json', contentType: mockFileObject.meta.contentType };
      const promise = bucket.put(mockFileObject.body, meta);
      await expect(promise).to.not.be.rejected;
      const object = await promise;
      expect(object.meta.name).to.equal('tmp/index.json');
    });

  });

  describe('delete()', () => {

    let createdObject: Object;
    beforeEach(async () => {
      const meta = { name: 'tmp/test.json', contentType: mockFileObject.meta.contentType };
      createdObject = await bucket.put(mockFileObject.body, meta);
    });

    it('deletes the file properly', async () => {
      await bucket.delete(createdObject.meta.name);
      const promise = bucket.get(createdObject.meta.name);
      expect(promise).to.be.rejectedWith(ObjectNotFoundError);
    });

    it('rejects when file not found', async () => {
      const promise = bucket.delete('tmp/do-not-exist.json');
      expect(promise).to.be.rejectedWith(ObjectNotFoundError);
    });

  });

});
