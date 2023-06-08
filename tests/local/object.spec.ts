import { expect } from 'chai';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { writeFileSync } from 'fs';
chai.use(chaiAsPromised);

import { Readable } from 'stream';
import path from 'path';
import fs from 'fs';

import { LocalObject } from '../../src/';
import { ObjectNotFoundError, PrefixNotFoundError } from '../../src/errors';

describe('LocalObject', () => {

  beforeEach(async () => {
  });

  describe('.fromPath', () => {

    it('returns a valid object for existing files', async () => {
      const fpath = path.join(__dirname, '/object.spec.ts');
      const promise = LocalObject.fromPath(fpath);
      expect(promise).to.eventually.be.an.instanceof(LocalObject);
      const object = await promise;
      expect(object.meta.name).to.equal(fpath);
      expect(object.meta.ctime).to.be.an.instanceof(Date);
      expect(object.meta.mtime).to.be.an.instanceof(Date);
    });

    it('rejects for invalid path', async () => {
      const promise = LocalObject.fromPath(path.join(__dirname, '/unknown.ts'));
      expect(promise).to.be.rejectedWith(ObjectNotFoundError);
    });

    describe('when provided with a basePath', () => {

      it('returns a valid object with only relative object name', async () => {
        const promise = LocalObject.fromPath('object.spec.ts', __dirname);
        expect(promise).to.eventually.be.an.instanceof(LocalObject);
        const object = await promise;
        expect(object.meta.name).to.equal('object.spec.ts');
      });

    });

  });

  describe('.readdir', () => {

    it('returns a valid list of objects metas for folder', async () => {
      const promise = LocalObject.readdir(path.join(__dirname));
      expect(promise).to.eventually.be.an('array');
      const metas = await promise;
      const thisTestFile = metas.find(m => m.name.indexOf('local/object.spec.ts') >= 0);
      // eslint-disable-next-line no-unused-expressions
      return expect(thisTestFile).to.exist;
    });

    it('rejects for unknown folders', async () => {
      const promise = LocalObject.readdir(path.join(__dirname, 'unknown'));
      return expect(promise).to.be.rejectedWith(PrefixNotFoundError, /Unable to find objects/);
    });

    describe('when provided with a basePath', () => {

      it('returns valid objects metas with only relative object names', async () => {
        const promise = LocalObject.readdir('./', __dirname);
        expect(promise).to.eventually.be.an('array');
        const metas = await promise;
        const thisTestFile = metas.find(m => m.name === 'object.spec.ts');
        // eslint-disable-next-line no-unused-expressions
        return expect(thisTestFile).to.exist;
      });

    });

  });

  describe('.delete', () => {

    it.skip('resolves for existing files', async () => {
      writeFileSync('/tmp/test.txt', 'test');
      await LocalObject.delete('/tmp/test.txt');
    });

    it('rejects for unknown files', () => {
      const p = LocalObject.delete('/tmp/unknown.txt');
      return expect(p).to.be.rejectedWith(ObjectNotFoundError);
    });

    it('rejects for directories', async () => {
      const p = LocalObject.delete(__dirname);
      return expect(p).to.be.rejectedWith(ObjectNotFoundError);
    });

  });

  describe('.write', () => {

    // ensure file does not exists
    const ensureRm = (path: string) => {
      try {
        fs.unlinkSync(path);
      } catch (_err) {
        return;
      }
    };

    const testFile = '/tmp/test.txt';
    const metadata = { name: testFile, contentType: 'application/json' };

    let readStream: Readable;
    beforeEach(() => {
      ensureRm(testFile);
      readStream = new Readable();
      readStream.push('hello world');
      readStream.push(null);
    });

    it('returns a valid object', async () => {
      const objMeta = await LocalObject.write(metadata, readStream);

      expect(objMeta.name).to.equal('/tmp/test.txt');
    });

    it('creates new files properly', async () => {
      await LocalObject.write(metadata, readStream);

      const content = fs.readFileSync(testFile).toString();
      expect(content).to.equal('hello world');
    });

    describe('when provided with a basePath', () => {

      it('returns valid objects with only relative object names', async () => {
        const metadata = { name: 'test.txt', contentType: 'text/plain' };
        const objMeta = await LocalObject.write(metadata, readStream, '/tmp');

        expect(objMeta.name).to.equal('test.txt');
      });

    });

  });
});
