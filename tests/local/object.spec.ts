import { expect } from 'chai';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import { readFileSync, writeFileSync } from 'fs';
chai.use(chaiAsPromised);

import { Readable } from 'stream';
import * as path from 'path';
import * as fs from 'fs';

import LocalObject from '../../src/local/object';
import { ObjectNotFoundError, PrefixNotFoundError } from '../../src/errors';

const streamToString = (stream): Promise<string> => {
  const chunks: any[] = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('error', (err) => reject(err));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });
};

describe.only('LocalObject', () => {

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

  describe('.write', () => {

    // ensure file does not exist
    const ensureRm = (path) => {
      try {
        fs.unlinkSync(path);
      } catch (_err) {
        return;
      }
    };

    const testFile = '/tmp/test.txt';
    let readStream;
    beforeEach(() => {
      ensureRm(testFile);
      readStream = new Readable();
      readStream.push('hello world');
      readStream.push(null);
    });

    it('returns a valid object', async () => {
      const obj = await LocalObject.write(testFile, readStream);

      expect(obj.name).to.equal('test.txt');
      expect(obj.path).to.equal('/tmp/test.txt');
    });

    it('creates new files properly', async () => {
      await LocalObject.write(testFile, readStream);

      const content = fs.readFileSync(testFile).toString();
      expect(content).to.equal('hello world');
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
