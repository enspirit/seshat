import { expect } from 'chai';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { readFileSync, writeFileSync } from 'fs';
chai.use(chaiAsPromised);

import { Readable } from 'stream';
import path from 'path';
import fs from 'fs';

import { streamToString } from '../helpers';
import LocalObject from '../../src/local/object';
import { ObjectNotFoundError, PrefixNotFoundError } from '../../src/errors';

describe('LocalObject', () => {

  let object: LocalObject;
  beforeEach(async () => {
    object = await LocalObject.fromPath(path.join(__dirname, '../../package.json'));
  });

  describe('.fromPath', () => {

    it('returns a valid object for existing files', async () => {
      const fpath = path.join(__dirname, '/object.spec.ts');
      const promise = LocalObject.fromPath(fpath);
      expect(promise).to.eventually.be.an.instanceof(LocalObject);
      const object = await promise;
      expect(object.meta.name).to.equal(fpath);
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

    it('returns a valid list of objects for folder', async () => {
      const promise = LocalObject.readdir(path.join(__dirname));
      expect(promise).to.eventually.be.an('array');
      const objects = await promise;
      const thisTestFile = objects.find(o => o.meta.name.indexOf('local/object.spec.ts') >= 0);
      // eslint-disable-next-line no-unused-expressions
      return expect(thisTestFile).to.exist;
    });

    it('rejects for unknown folders', async () => {
      const promise = LocalObject.readdir(path.join(__dirname, 'unknown'));
      return expect(promise).to.be.rejectedWith(PrefixNotFoundError, /Unable to find objects/);
    });

    describe('when provided with a basePath', () => {

      it('returns valid objects with only relative object names', async () => {
        const promise = LocalObject.readdir('./', __dirname);
        expect(promise).to.eventually.be.an('array');
        const objects = await promise;
        const thisTestFile = objects.find(o => o.meta.name === 'object.spec.ts');
        // eslint-disable-next-line no-unused-expressions
        return expect(thisTestFile).to.exist;
      });

    });

  });

  describe('.delete', () => {

    it('resolves for existing files', async () => {
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

    // ensure file does not exist
    const ensureRm = (path: string) => {
      try {
        fs.unlinkSync(path);
      } catch (_err) {
        return;
      }
    };

    const testFile = '/tmp/test.txt';
    let readStream: Readable;
    beforeEach(() => {
      ensureRm(testFile);
      readStream = new Readable();
      readStream.push('hello world');
      readStream.push(null);
    });

    it('returns a valid object', async () => {
      const obj = await LocalObject.write(testFile, readStream);

      expect(obj.meta.name).to.equal('/tmp/test.txt');
    });

    it('creates new files properly', async () => {
      await LocalObject.write(testFile, readStream);

      const content = fs.readFileSync(testFile).toString();
      expect(content).to.equal('hello world');
    });

    describe('when provided with a basePath', () => {

      it('returns valid objects with only relative object names', async () => {
        const obj = await LocalObject.write('test.txt', readStream, '/tmp');

        expect(obj.meta.name).to.equal('test.txt');
      });

    });

  });

  describe('#getReadableStream', () => {

    it('works as expected', async () => {
      const stream = await object.getReadableStream();
      const string = await streamToString(stream);
      expect(string).to.match(/name.*@enspirit\/seshat/);
    });

  });

  describe('#getWritableStream', () => {

    it('works as expected', async () => {
      writeFileSync('/tmp/test.txt', '');
      const object = await LocalObject.fromPath('/tmp/test.txt');
      const stream = await object.getWritableStream();
      stream.write('hello world');
      stream.end();
      await new Promise(resolve => stream.on('finish', resolve));
      const content = readFileSync('/tmp/test.txt');
      expect(content.toString()).to.equal('hello world');
    });

  });

});
