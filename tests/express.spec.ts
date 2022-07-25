import { Application } from 'express';
import { createApp } from '../src/express';
import request from 'supertest';
import chai from 'chai';
import path from 'path';
import mockBucket, { reset as resetMockBucket } from './mocks/bucket';
import { mockFileObject } from './mocks/object';
import { expect } from 'chai';
import sinonChai from 'sinon-chai';
import { BucketPolicyError, ObjectNotFoundError } from '../src/errors';
import sinon from 'sinon';
import { Readable } from 'stream';
chai.use(sinonChai);

describe('the express app', () => {

  let app: Application, config;
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
      expect(mockBucket.get).to.be.calledOnceWith('/file.txt');
    });

    it('gets the correct object from the bucket (file in subfolder)', async () => {
      await request(app).get('/subfolder/another.pdf');
      return expect(mockBucket.get).to.be.calledOnceWith('/subfolder/another.pdf');
    });

    it('returns proper status code and content-type when bucket has object', () => {
      const stub = mockBucket.get as sinon.SinonStub;
      stub.resolves(mockFileObject);
      const contentLength = mockFileObject.meta?.contentLength?.toString() as string;

      return request(app)
        .get('/file.txt')
        .expect('Content-Type', mockFileObject.meta.contentType)
        .expect('Content-Length', contentLength)
        .expect(200);
    });

    it('returns proper status code when bucket reports object not found', async () => {
      const stub = mockBucket.get as sinon.SinonStub;
      stub.rejects(new ObjectNotFoundError('oops'));

      await request(app)
        .get('/file.txt')
        .expect(404);

      stub.reset();
    });

    it('returns proper status code when bucket reports unknown error', async () => {
      const stub = mockBucket.get as sinon.SinonStub;
      stub.rejects(new Error('oops'));

      await request(app)
        .get('/file.txt')
        .expect(500);

      stub.reset();
    });

    it('returns proper status code and error when a policy fails', async () => {
      const stub = mockBucket.get as sinon.SinonStub;
      stub.rejects(new BucketPolicyError('access denied'));

      await request(app)
        .get('/file.txt')
        .expect(400)
        .expect('Content-Type', /application\/json/)
        .expect({
          error: 'access denied',
        });

      stub.reset();
    });

  });

  describe('on POST /:path', () => {

    it('properly writes the object on bucket (one file)', async () => {
      await request(app)
        .post('/')
        .attach('package.json', path.join(__dirname, '../package.json'))
        .expect(200);

      await expect(mockBucket.put).to.be.calledOnceWith(
        sinon.match.instanceOf(Readable),
        { name: '/package.json', contentType: 'application/json' },
      );
    });

    it('properly returns the object list (one file)', async () => {
      const res = await request(app)
        .post('/')
        .attach('package.json', path.join(__dirname, '../package.json'))
        .expect(200);

      expect(res.body).to.be.an('array');
      expect(res.body).to.have.length(1);
      const [object] = res.body;
      expect(object.name).to.equal(mockFileObject.meta.name);
      expect(object.contentType).to.equal(mockFileObject.meta.contentType);
    });

    it('properly writes the objects on bucket (multiple files)', async () => {
      await request(app)
        .post('/')
        .attach('package.json', path.join(__dirname, '../package.json'))
        .attach('tsconfig.json', path.join(__dirname, '../tsconfig.json'))
        .expect(200);

      // eslint-disable-next-line no-unused-expressions
      expect(mockBucket.put).to.be.calledTwice;
      await expect(mockBucket.put).to.be.calledWith(
        sinon.match.instanceOf(Readable),
        { name: '/package.json', contentType: 'application/json' },
      );
      await expect(mockBucket.put).to.be.calledWith(
        sinon.match.instanceOf(Readable),
        { name: '/tsconfig.json', contentType: 'application/json' },
      );
    });

    it('returns proper status code and error when a policy fails', async () => {
      const stub = mockBucket.put = sinon.stub();
      stub.rejects(new BucketPolicyError('access denied'));

      await request(app)
        .post('/')
        .attach('package.json', path.join(__dirname, '../package.json'))
        .expect(400);

      stub.reset();
    });

  });

  describe('on DELETE /:file', () => {
    it('deletes the correct object from the bucket (file)', async () => {
      await request(app)
        .delete('/file.txt');
      expect(mockBucket.delete).to.be.calledOnceWith('/file.txt');
    });

    it('deletes the correct object from the bucket (subfolder file)', async () => {
      await request(app).delete('/subfolder/file.txt');
      expect(mockBucket.delete).to.be.calledOnceWith('/subfolder/file.txt');
    });

    it('returns proper status code when bucket has object', () => {
      const stub = mockBucket.delete as sinon.SinonStub;
      stub.resolves();

      return request(app)
        .delete('/file.txt')
        .expect(204);
    });

    it('returns proper status code when bucket reports object not found', async () => {
      const stub = mockBucket.delete as sinon.SinonStub;
      stub.rejects(new ObjectNotFoundError('oops'));

      await request(app)
        .delete('/file.txt')
        .expect(404);

      stub.reset();
    });

    it('returns proper status code when bucket reports unknown error', async () => {
      const stub = mockBucket.get as sinon.SinonStub;
      stub.rejects(new Error('oops'));

      await request(app)
        .get('/file.txt')
        .expect(500);

      stub.reset();
    });

    it('returns proper status code and error when a policy fails', async () => {
      const stub = mockBucket.delete = sinon.stub();
      stub.rejects(new BucketPolicyError('access denied'));

      await request(app)
        .delete('/file.txt')
        .expect(400)
        .expect('Content-Type', /application\/json/)
        .expect({
          error: 'access denied',
        });

      stub.reset();
    });
  });

});
