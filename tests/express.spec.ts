import { createApp } from '../src/express';
import * as request from 'supertest';
import * as chai from 'chai';
import mockBucket, { reset as resetMockBucket } from './mocks/bucket';
import { mockFileObject } from './mocks/object';
import { expect } from 'chai';
import * as sinonChai from 'sinon-chai';
import { ObjectNotFoundError } from '../src/errors';
import * as sinon from 'sinon';
chai.use(sinonChai);

describe('the express app', () => {

  let app, config;
  beforeEach(() => {
    config = {
      bucket: mockBucket,
    };
    app = createApp(config);
  });

  beforeEach(() => {
    resetMockBucket();
  });

  describe('on DELETE /:file', () => {
    it('deletes the correct object from the bucket (file)', async () => {
      await request(app).delete('/file.txt');
      expect(mockBucket.delete).to.be.calledOnceWith('file.txt');
    });

    it('deletes the correct object from the bucket (subfolder file)', async () => {
      await request(app).delete('/subfolder/file.txt');
      expect(mockBucket.delete).to.be.calledOnceWith('subfolder/file.txt');
    });

    it('returns proper status code when bucket has object', () => {
      const stub = mockBucket.delete as sinon.SinonStub;
      stub.resolves();

      return request(app)
        .delete('/file.txt')
        .expect(204);
    });

    it('returns proper status code when bucket reports object not found', () => {
      const stub = mockBucket.delete as sinon.SinonStub;
      stub.rejects(new ObjectNotFoundError('oops'));

      return request(app)
        .delete('/file.txt')
        .expect(404);
    });

    it('returns proper status code when bucket reports unknown error', async () => {
      const stub = mockBucket.get as sinon.SinonStub;
      stub.rejects(new Error('oops'));

      await request(app)
        .get('/file.txt')
        .expect(500);
    });
  });

  describe('on GET /:file', () => {

    it('gets the correct object from the bucket (file)', async () => {
      await request(app).get('/file.txt');
      expect(mockBucket.get).to.be.calledOnceWith('file.txt');
    });

    it('gets the correct object from the bucket (subfolder)', async () => {
      await request(app).get('/subfolder/another.pdf');
      return expect(mockBucket.get).to.be.calledOnceWith('subfolder/another.pdf');
    });

    it('returns proper status code and content-type when bucket has object', () => {
      const stub = mockBucket.get as sinon.SinonStub;
      stub.resolves(mockFileObject);

      return request(app)
        .get('/file.txt')
        .expect('Content-Type', mockFileObject.contentType)
        .expect('Content-Length', mockFileObject.contentLength.toString())
        .expect(200);
    });

    it('returns proper status code when bucket reports object not found', () => {
      const stub = mockBucket.get as sinon.SinonStub;
      stub.rejects(new ObjectNotFoundError('oops'));

      return request(app)
        .get('/file.txt')
        .expect(404);
    });

    it('returns proper status code when bucket reports unknown error', async () => {
      const stub = mockBucket.get as sinon.SinonStub;
      stub.rejects(new Error('oops'));

      await request(app)
        .get('/file.txt')
        .expect(500);
    });

  });

});
