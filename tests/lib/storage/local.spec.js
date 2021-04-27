'use strict';

const Promise = require('bluebird');
const proxyquire = require('proxyquire');
const sinon = require('sinon');
const expect = require('chai').expect;
const stream = require('stream');
const devnull = require('dev-null');
const chaiAsPromised = require('chai-as-promised');
const { FileNotFoundError, ArgumentError, UnsecurePathError } =
  require('../../../lib/robust/errors');

require('chai').use(chaiAsPromised);
require('chai').use(require('sinon-chai'));

describe('LocalStorage', () => {

  let LocalStorage, mockWriteStream, createWriteStream;
  let storage, fstream, dynamicTree, mockFs;
  let mockMkdirP;

  beforeEach(() => {
    mockMkdirP = sinon.stub().returns(Promise.resolve());
    mockFs = {
      createWriteStream: createWriteStream,
      exists: sinon.stub().yields(true)
    };
    mockWriteStream = devnull();
    createWriteStream = sinon.stub().returns(mockWriteStream);
    LocalStorage = proxyquire('../../../lib/storage/local', {
      'fs': mockFs,
      'mkdirp-promise': mockMkdirP
    });

    dynamicTree = false;
    storage = new LocalStorage({ path: '/tmp', dynamicTree: dynamicTree });
    fstream = new stream.Readable();
    fstream.push('hello world');
    fstream.push(null);
  });

  describe('#save', () => {

    it('raises an error if the file is not a ReadableStream', (done) => {
      storage.save('test')
        .then(() => done(new Error('should have failed')))
        .catch((err) => {
          expect(err).to.be.an.instanceof(TypeError);
          done();
        });
    });

    it('raises an error if no filename are provided', (done) => {
      storage.save(fstream)
        .then(() => done(new Error('should have failed')))
        .catch((err) => {
          expect(err).to.be.an.instanceof(ArgumentError);
          done();
        });
    });

    it('raises an error if the path provided is not secure', (done) => {
      storage.save(fstream, '../../etc/hosts')
        .then(() => done(new Error('should have failed')))
        .catch((err) => {
          expect(err).to.be.an.instanceof(UnsecurePathError);
          done();
        });
    });

    it('complains if a subdir does not exist and dynamicTree is false',
      (done) => {
        mockFs.exists = sinon.stub().yields(false);
        storage.save(fstream, 'foo/bar/test.jpg')
          .then(() => done(new Error('should have failed')))
          .catch((err) => {
            expect(err).to.be.an.instanceof(FileNotFoundError);
            done();
          });
      });

    /*it('creates the subdir if it does not exist and dynamicTree is false', (done) => {
      storage = new LocalStorage({path: '/tmp', dynamicTree: true});
      mockFs.exists = sinon.stub().yields(false);
      storage.save(fstream, 'foo/bar/test.jpg')
      .then(() => done(new Error('should have failed')))
      .catch((err) => {
        expect(err).to.be.an.instanceof(ArgumentError);
        done();
      });
      mockWriteStream.end();
    });

    it('creates a write stream and pipes the file stream to it', (done) => {
      storage.save(fstream, 'test.jpg')
      .then(() => {
        expect(createWriteStream).to.be.calledOnce;
        expect(mockWriteStream._write).to.be.called;
        done();
      })
      .catch((err) => done(err));
    });*/

  });

});
