import request from 'supertest';
import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { createRouter } from '../../../src/express/routers/multipart-uploads';
import { getMockBucket } from '../../mocks/bucket';
import { Bucket, Config } from '../../../src/types';
chai.use(sinonChai);

import express, { Application } from 'express';
import { getMockFileObject } from '../../mocks/object';
import { Readable } from 'stream';

describe('the multipart-uploads express router', () => {

  let config: Config;

  let router;
  let app: Application;
  let mockBucket: Bucket;
  beforeEach(() => {
    mockBucket = getMockBucket();
    config = {
      bucket: mockBucket,
    };
    router = createRouter(config);

    mockBucket.put = async (stream, _metadata) => {
      stream.resume();
      return getMockFileObject();
    };

    app = express();
    app.use(router);
  });

  describe('when used with default options', () => {

    describe('when POSTing a non multipart form data', () => {

      it('passes its turn and let other routes match', () => {
        return request(app)
          .post('/subfolder')
          .set('Content-Type', 'application/json')
          .expect(404);
      });

    });

    describe('when POSTing a multipart form data', () => {

      describe('when posting a single file at the root', () => {

        it('returns an http status 200', () => {
          return request(app)
            .post('/')
            .attach('test.ts', __filename)
            .expect(200);
        });

        it('creates the file on the bucket', async () => {
          const spy = sinon.spy(mockBucket, 'put');
          await request(app)
            .post('/')
            .attach('test.ts', __filename);
          return expect(spy).to.be.calledOnceWith(
            sinon.match.instanceOf(Readable),
            sinon.match({ name: 'test.ts' }),
          );
        });
      });

      describe('when posting a single file in a subfolder', () => {

        it('returns an http status 200', () => {
          return request(app)
            .post('/subfolder')
            .attach('test.ts', __filename)
            .expect(200);
        });

        it('creates the file on the bucket', async () => {
          const spy = sinon.spy(mockBucket, 'put');
          await request(app)
            .post('/subfolder')
            .attach('test.ts', __filename);
          await expect(spy).to.be.calledOnceWith(
            sinon.match.instanceOf(Readable),
            sinon.match({ name: 'subfolder/test.ts' }),
          );
        });

      });

      describe('when posting multiple files at the root', () => {

        it('returns an http status 200', () => {
          return request(app)
            .post('/')
            .attach('test.ts', __filename)
            .attach('another.ts', __filename)
            .expect(200);
        });

        it('creates all the files on the bucket', async () => {
          const spy = sinon.spy(mockBucket, 'put');

          await request(app)
            .post('/')
            .attach('test.ts', __filename)
            .attach('another.ts', __filename);

          await expect(spy).to.be.calledTwice;
          await expect(spy).to.be.calledWith(
            sinon.match.instanceOf(Readable),
            sinon.match({ name: 'test.ts' }),
          );
          await expect(spy).to.be.calledWith(
            sinon.match.instanceOf(Readable),
            sinon.match({ name: 'another.ts' }),
          );
        });

      });

      describe('when posting multiple files in a subfolder', () => {

        it('returns an http status 200', () => {
          return request(app)
            .post('/subfolder')
            .attach('test.ts', __filename)
            .attach('another.ts', __filename)
            .expect(200);
        });

        it('creates all the files on the bucket', async () => {
          const spy = sinon.spy(mockBucket, 'put');

          await request(app)
            .post('/subfolder')
            .attach('test.ts', __filename)
            .attach('another.ts', __filename);

          await expect(spy).to.be.calledTwice;

          await expect(spy).to.be.calledWith(
            sinon.match.instanceOf(Readable),
            sinon.match({ name: 'subfolder/test.ts' }),
          );

          await expect(spy).to.be.calledWith(
            sinon.match.instanceOf(Readable),
            sinon.match({ name: 'subfolder/another.ts' }),
          );

        });

      });

    });
  });

});
