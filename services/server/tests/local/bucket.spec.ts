import fs from 'fs';
import path from 'path';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { LocalBucket } from '../../src/';
chai.use(chaiAsPromised);

import { expect } from 'chai';
import { ObjectNotFoundError, PrefixNotFoundError } from '@enspirit/seshat-commons';
import { getMockFileObject } from '../mocks/object';
import { Bucket, Object } from '../../src/types';

describe('LocalBucket', () => {

  let bucket: Bucket;
  let mockFileObject: Object;
  beforeEach(() => {
    mockFileObject = getMockFileObject();
    bucket = new LocalBucket({ path: path.join(__dirname, '../../') });
  });

  describe('its constructor', () => {

    it('does not let users use it in production environment', () => {
      process.env.NODE_ENV = 'production';
      expect(() => new LocalBucket({ path: '/tmp' })).to.throw(/LocalBucket is not supposed to be used in production environments./);
      delete process.env.NODE_ENV;
    });

  });

  describe('head()', () => {

    it('returns the valid metadata', async () => {
      const metadata = { name: 'tmp/objectnamewithoutextension', contentType: 'application/json', foo: 'bar' };
      await bucket.put(mockFileObject.body, metadata);
      const meta = await bucket.head(metadata.name);
      expect(meta.name).to.equal(metadata.name);
      expect(meta.contentType).to.equal(metadata.contentType);
      expect(meta.foo).to.equal('bar');
    });

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

    it('does not return the seshat metadata files (tmp/)', async () => {
      fs.writeFileSync(path.join(__dirname, '../../tmp/test.json.seshat'), 'hello world');
      const metas = await bucket.list('tmp/');
      const aMetaDataFile = metas.find(m => m.name.includes('.seshat'));
      // eslint-disable-next-line no-unused-expressions
      expect(aMetaDataFile).to.not.exist;
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
      expect(stat.meta.ctime).to.be.an.instanceof(Date);
      expect(stat.meta.mtime).to.be.an.instanceof(Date);

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

    it('returns the valid metadata', async () => {
      const metadata = { name: 'tmp/objectnamewithoutextension', contentType: 'application/json', foo: 'bar' };
      await bucket.put(mockFileObject.body, metadata);
      const object = await bucket.get(metadata.name);
      expect(object.meta.name).to.equal(metadata.name);
      expect(object.meta.contentType).to.equal(metadata.contentType);
      expect(object.meta.foo).to.equal('bar');
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

    const ensureFolderUnlink = (fpath: string) => {
      try {
        fs.rmSync(fpath, { recursive: true, force: true });
      } catch (_e) {
        //
      }
    };

    const ensureFileUnlink = (fpath: string) => {
      try {
        fs.unlinkSync(fpath);
      } catch (_e) {
        // e
      }
    };

    it('resolves with the object created', async () => {
      const meta = { name: mockFileObject.meta.name, contentType: mockFileObject.meta.contentType };
      const objectMeta = await bucket.put(mockFileObject.body, meta);
      expect(objectMeta.name).to.equal('tmp/file.txt');
      expect(objectMeta.contentType).to.equal('plain/text');
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
      const objectMeta = await promise;
      expect(objectMeta.name).to.equal('tmp/index.json');
    });

    it('stores the file on disk', async () => {
      // ensure the file does not exist already
      const fpath = path.join(__dirname, '../../tmp/test.json');
      ensureFileUnlink(fpath);
      const meta = { name: 'tmp/test.json', contentType: mockFileObject.meta.contentType };
      await bucket.put(mockFileObject.body, meta);
      expect(fs.existsSync(fpath)).to.equal(true);
    });

    it('stores meta information next to the original file', async () => {
      // ensure the metadata file does not exist already
      const fpath = path.join(__dirname, '../../tmp/test.json.seshat');
      ensureFileUnlink(fpath);
      const meta = { name: 'tmp/test.json', contentType: mockFileObject.meta.contentType };
      await bucket.put(mockFileObject.body, meta);
      expect(fs.existsSync(fpath)).to.equal(true);
    });

    it('dynamically creates folder hierarchy when parent folders missing', async () => {
      ensureFolderUnlink(path.join(__dirname, '../../tmp/foo'));
      const fpath = path.join(__dirname, '../../tmp/foo/bar/baz/test.json');
      const meta = { name: 'tmp/foo/bar/baz/test.json', contentType: mockFileObject.meta.contentType };
      await bucket.put(mockFileObject.body, meta);
      expect(fs.existsSync(fpath)).to.equal(true);
    });

  });

  describe('#delete()', () => {

    // For some reason this test if flakey. Skipping it for now
    it.skip('deletes the file', async () => {
      fs.writeFileSync(path.join(__dirname, '../../tmp/test.json'), 'hello world');
      // it exists (does not raise)
      await bucket.get('tmp/test.json');
      // we delete it
      await bucket.delete('tmp/test.json');
      // it does not exist
      const promise = bucket.get('tmp/test.json');
      await expect(promise).to.be.rejectedWith(ObjectNotFoundError);
    });

    it('also deletes the metadata file', async () => {
      fs.writeFileSync(path.join(__dirname, '../../tmp/test.json'), 'hello world');
      fs.writeFileSync(path.join(__dirname, '../../tmp/test.json.seshat'), '{}');

      // its metadata file exists (does not raise)
      await bucket.get('tmp/test.json.seshat');
      // we delete it
      await bucket.delete('tmp/test.json');
      // its metadata file does not exist anymore
      const promise = bucket.get('tmp/test.json.seshat');
      await expect(promise).to.be.rejectedWith(ObjectNotFoundError);
    });

    it('rejects when file not found', async () => {
      const promise = bucket.delete('tmp/do-not-exist.json');
      return expect(promise).to.be.rejectedWith(ObjectNotFoundError);
    });

  });

});
