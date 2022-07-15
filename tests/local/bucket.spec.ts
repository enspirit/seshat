import * as path from 'path';
import * as chai from 'chai';
import LocalBucket from '../../src/local/bucket';
import * as chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);

import { expect } from 'chai';
import { ObjectNotFoundError, PrefixNotFoundError } from '../../src/errors';

describe('LocalBucket', () => {

  let bucket;
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
      const indexTs = objects.find(o => o.name === 'index.ts');
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
      expect(stat.name).to.equal('index.ts');
      expect(stat.isFile).to.equal(true);
      expect(stat.isDirectory).to.equal(false);
    });

    it('resolves the correct fstat information (folder)', async () => {
      const stat = await bucket.get('src/');
      expect(stat.name).to.equal('src');
      expect(stat.isFile).to.equal(false);
      expect(stat.isDirectory).to.equal(true);
    });

    it('resolves the correct fstat information (subfolder)', async () => {
      const stat = await bucket.get('src/local');
      expect(stat.name).to.equal('local');
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

    it('accepts relative path while they remain in bucket', () => {
      const promise = bucket.get('src/local/../index.ts');
      return expect(promise).to.not.be.rejected;
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

});
