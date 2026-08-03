import request from 'supertest';
import { RetrieveObjects } from '../../../src/express/routers/index.js';
import { getMockBucket } from '../../mocks/bucket.js';
import { ExposeContext } from '../../../src/express/middlewares/context.js';
import { Bucket } from '../../../src/types.js';

import express, { Application } from 'express';

describe('the retrieve-objects express router', () => {

  let mockBucket: Bucket;

  const appWith = (router): Application => {
    const app = express();
    app.use(ExposeContext({ bucket: mockBucket }));
    app.use(router);
    return app;
  };

  beforeEach(() => {
    mockBucket = getMockBucket();
  });

  describe('the Cache-Control header', () => {

    it('is not sent when used with default options', () => {
      return request(appWith(RetrieveObjects()(mockBucket)))
        .get('/tmp/file.txt')
        .expect(200)
        .expect((res) => {
          if ('cache-control' in res.headers) {
            throw new Error(`Unexpected Cache-Control: ${res.headers['cache-control']}`);
          }
        });
    });

    it('is sent when explicitly configured', () => {
      const router = RetrieveObjects({
        headers: { cacheControl: 'private, max-age=86400, must-revalidate' },
      })(mockBucket);
      return request(appWith(router))
        .get('/tmp/file.txt')
        .expect(200)
        .expect('Cache-Control', 'private, max-age=86400, must-revalidate');
    });

    it('is not sent when explicitly configured with an empty value', () => {
      const router = RetrieveObjects({ headers: { cacheControl: '' } })(mockBucket);
      return request(appWith(router))
        .get('/tmp/file.txt')
        .expect(200)
        .expect((res) => {
          if ('cache-control' in res.headers) {
            throw new Error(`Unexpected Cache-Control: ${res.headers['cache-control']}`);
          }
        });
    });

  });

});
