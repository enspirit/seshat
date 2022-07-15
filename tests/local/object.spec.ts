import * as path from 'path';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);

import { expect } from 'chai';
import LocalObject from '../../src/local/object';

describe('LocalObject', () => {

  let object;
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
      expect(promise).to.be.rejectedWith(/ENOENT/);
    });

  });

  describe('#getReadableStream', () => {

    const streamToString = (stream): Promise<string> => {
      const chunks: any[] = [];
      return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        stream.on('error', (err) => reject(err));
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      });
    };

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

});
