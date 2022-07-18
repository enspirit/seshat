import { createApp } from '../src/express';
import request from 'supertest';
import chai from 'chai';
import path from 'path';
import mockBucket, { reset as resetMockBucket } from './mocks/bucket';
import { mockFileObject, mockFolderObject } from './mocks/object';
import { expect } from 'chai';
import sinonChai from 'sinon-chai';
import { ObjectNotFoundError } from '../src/errors';
import sinon from 'sinon';
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

  describe('on GET /:path', () => {

    it('gets the correct object from the bucket (file)', async () => {
      await request(app).get('/file.txt');
      expect(mockBucket.get).to.be.calledOnceWith('file.txt');
    });

    it('gets the correct object from the bucket (file in subfolder)', async () => {
      await request(app).get('/subfolder/another.pdf');
      return expect(mockBucket.get).to.be.calledOnceWith('subfolder/another.pdf');
    });

    it('returns proper 404 status code and content-type when path is folder', async () => {
      const stub = mockBucket.get as sinon.SinonStub;
      stub.resolves(mockFolderObject);

      return request(app)
        .get('/subfolder')
        .expect(404);
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

  describe('on POST /:path', () => {

    it('properly writes the object on bucket (one file)', async () => {
      await request(app)
        .post('/')
        .attach('package.json', path.join(__dirname, '../package.json'))
        .expect(200);

      expect(mockBucket.put).to.be.calledOnceWith('package.json');
    });

    it('properly returns the object list (one file)', async () => {
      const res = await request(app)
        .post('/')
        .attach('package.json', path.join(__dirname, '../package.json'))
        .expect(200);

      expect(res.body).to.be.an('array');
      expect(res.body).to.have.length(1);
    });

    it('properly writes the objects on bucket (multiple files)', async () => {
      await request(app)
        .post('/')
        .attach('package.json', path.join(__dirname, '../package.json'))
        .attach('tsconfig.json', path.join(__dirname, '../tsconfig.json'))
        .expect(200);

      // eslint-disable-next-line no-unused-expressions
      expect(mockBucket.put).to.be.calledTwice;
      expect(mockBucket.put).to.be.calledWith('package.json');
      expect(mockBucket.put).to.be.calledWith('tsconfig.json');
    });

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

});
