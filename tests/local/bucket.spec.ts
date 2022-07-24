import path from 'path';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import LocalBucket from '../../src/local/bucket';
chai.use(chaiAsPromised);

import { expect } from 'chai';
import { ObjectNotFoundError, PrefixNotFoundError } from '../../src/errors';
import { mockFileObject } from '../mocks/object';
import { Object, Bucket } from '../../src/types';

describe('LocalBucket', () => {

  let bucket: Bucket;
  beforeEach(() => {
    bucket = new LocalBucket(path.join(__dirname, '../../'));
  });

  describe('list()', () => {

    it('resolves the correct list of objects (no param)', async () => {
      const objects = await bucket.list();
      const packageJson = objects.find(o => o.name === 'package.json');
      // eslint-disable-next-line no-unused-expressions
      expect(packageJson).to.exist;
    });

    it('resolves the correct list of objects (src/)', async () => {
      const objects = await bucket.list('src/');
      const indexTs = objects.find(o => o.name === 'src/index.ts');
      // eslint-disable-next-line no-unused-expressions
      expect(indexTs).to.exist;
    });

    it('rejects if the prefix/folder does not exist', () => {
      const promise = bucket.list('unknown/');
      return expect(promise).to.be.rejectedWith(PrefixNotFoundError);
    });

  });

  describe('get()', () => {

    it('resolves the correct fstat information (file)', async () => {
      const stat = await bucket.get('package.json');
      expect(stat.name).to.equal('package.json');
      expect(stat.isFile).to.equal(true);
      expect(stat.isDirectory).to.equal(false);
      expect(stat.contentType).to.equal('application/json');
    });

    it('resolves the correct fstat information (file in subfolder)', async () => {
      const stat = await bucket.get('src/index.ts');
      expect(stat.name).to.equal('src/index.ts');
      expect(stat.isFile).to.equal(true);
      expect(stat.isDirectory).to.equal(false);
    });

    it('resolves the correct fstat information (folder)', async () => {
      const stat = await bucket.get('src/');
      expect(stat.name).to.equal('src/');
      expect(stat.isFile).to.equal(false);
      expect(stat.isDirectory).to.equal(true);
    });

    it('resolves the correct fstat information (subfolder)', async () => {
      const stat = await bucket.get('src/local');
      expect(stat.name).to.equal('src/local');
      expect(stat.isFile).to.equal(false);
      expect(stat.isDirectory).to.equal(true);
    });

    it('rejects if file does not exist', () => {
      const promise = bucket.get('unknown.file');
      return expect(promise).to.be.rejectedWith(ObjectNotFoundError);
    });

    it('rejects if folder does not exist', () => {
      const promise = bucket.get('folder/');
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
      expect(object.name).to.equal('src/index.ts');
    });

  });

  describe('exists()', () => {
    it('resolves true for existing files/folders', async () => {
      expect(await bucket.exists('package.json')).to.equal(true);
      expect(await bucket.exists('src/index.ts')).to.equal(true);
      expect(await bucket.exists('src/')).to.equal(true);
      expect(await bucket.exists('src/local')).to.equal(true);
    });

    it('resolves false for unknown files/folders', async () => {
      expect(await bucket.exists('unknown.json')).to.equal(false);
      expect(await bucket.exists('unknown/something')).to.equal(false);
      expect(await bucket.exists('src/unknown.js')).to.equal(false);
    });
  });

  describe('fileExists()', () => {
    it('resolves true for existing files', async () => {
      expect(await bucket.fileExists('package.json')).to.equal(true);
      expect(await bucket.fileExists('src/index.ts')).to.equal(true);
    });

    it('resolves false for unknown files or existing folders', async () => {
      expect(await bucket.fileExists('unknown.json')).to.equal(false);
      expect(await bucket.fileExists('src/')).to.equal(false);
      expect(await bucket.fileExists('src/unknown.js')).to.equal(false);
    });
  });

  describe('dirExists()', () => {
    it('resolves true for existing folders', async () => {
      expect(await bucket.dirExists('src/')).to.equal(true);
      expect(await bucket.dirExists('src/local')).to.equal(true);
    });

    it('resolves false for unknown folders or existing files', async () => {
      expect(await bucket.dirExists('package.json')).to.equal(false);
      expect(await bucket.dirExists('src/unknown')).to.equal(false);
      expect(await bucket.dirExists('unknown/')).to.equal(false);
    });
  });

  describe('put()', () => {

    it('resolves with the object created', async () => {
      const meta = { name: 'tmp/test.json', mimeType: mockFileObject.contentType };
      const object = await bucket.put(await mockFileObject.getReadableStream(), meta);
      expect(object.name).to.equal('tmp/test.json');
      expect(object.contentType).to.equal('application/json');
    });

    it('rejects if path goes out of bucket', async () => {
      const meta = { name: '../../../file.txt', mimeType: mockFileObject.contentType };
      const promise = bucket.put(await mockFileObject.getReadableStream(), meta);
      return expect(promise).to.be.rejectedWith(/Relative paths are not allowed/);
    });

    it('accepts relative path while they remain in bucket', async () => {
      const meta = { name: 'tmp/subfolder/../index.json', mimeType: mockFileObject.contentType };
      const promise = bucket.put(await mockFileObject.getReadableStream(), meta);
      await expect(promise).to.not.be.rejected;
      const object = await promise;
      expect(object.name).to.equal('tmp/index.json');
    });

  });

  describe('delete()', () => {

    let createdObject: Object;
    beforeEach(async () => {
      const meta = { name: 'test.json', mimeType: mockFileObject.contentType };
      createdObject = await bucket.put(await mockFileObject.getReadableStream(), meta);
    });

    it('deletes the file properly', async () => {
      await bucket.delete(createdObject.name);
      const promise = bucket.get(createdObject.name);
      expect(promise).to.be.rejectedWith(ObjectNotFoundError);
    });

    it('rejects when file not found', async () => {
      const promise = bucket.delete('tmp/do-not-exist.json');
      expect(promise).to.be.rejectedWith(ObjectNotFoundError);
    });

  });

});
