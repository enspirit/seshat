import * as path from 'path';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);

import { expect } from 'chai';
import LocalObject from '../../src/local/object';
import { fstat, readFileSync, writeFileSync } from 'fs';
import { ObjectNotFoundError, PrefixNotFoundError } from '../../src/errors';

const streamToString = (stream): Promise<string> => {
  const chunks: any[] = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('error', (err) => reject(err));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });
};

describe('LocalObject', () => {

  let object: LocalObject;
  beforeEach(async () => {
    object = await LocalObject.fromPath(path.join(__dirname, '../../package.json'));
  });

  describe('.fromPath', () => {

    it('returns a valid object for existing files', async () => {
      const promise = LocalObject.fromPath(path.join(__dirname, '/object.spec.ts'));
      expect(promise).to.eventually.be.an.instanceof(LocalObject);
      const object = await promise;
      expect(object.name).to.equal('object.spec.ts');
    });

    it('rejects for invalid path', async () => {
      const promise = LocalObject.fromPath(path.join(__dirname, '/unknown.ts'));
      expect(promise).to.be.rejectedWith(ObjectNotFoundError);
    });

  });

  describe('.readdir', () => {

    it('returns a valid list of objects for folder', async () => {
      const promise = LocalObject.readdir(path.join(__dirname));
      expect(promise).to.eventually.be.an('array');
      const objects = await promise;
      const thisTestFile = objects.find(o => o.name === 'object.spec.ts');
      // eslint-disable-next-line no-unused-expressions
      return expect(thisTestFile).to.exist;
    });

    it('rejects for unknown folders', async () => {
      const promise = LocalObject.readdir(path.join(__dirname, 'unknown'));
      return expect(promise).to.be.rejectedWith(PrefixNotFoundError, /Unable to find objects/);
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

    it('rejects for unknown files', async () => {
      const p = LocalObject.delete(__dirname);
      return expect(p).to.be.rejectedWith(/Path does not match single object/);
    });

  });

  describe('#getReadableStream', () => {

    it('works as expected', async () => {
      const stream = object.getReadableStream();
      const string = await streamToString(stream);
      expect(string).to.match(/name.*@enspirit\/seshat/);
    });

    it('rejects for objects that are not files', async () => {
      const folder = await LocalObject.fromPath(__dirname);
      expect(() => folder.getReadableStream()).to.throw(/object is not a file/);
    });

  });

  describe('#getWritableStream', () => {

    it('works as expected', async () => {
      writeFileSync('/tmp/test.txt', '');
      const object = await LocalObject.fromPath('/tmp/test.txt');
      const stream = object.getWritableStream();
      stream.write('hello world');
      stream.end();
      await new Promise(resolve => stream.on('finish', resolve));
      const content = readFileSync('/tmp/test.txt');
      expect(content.toString()).to.equal('hello world');
    });

  });

});
