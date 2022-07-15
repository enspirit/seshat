import { createMiddleware } from '../src/express';
import * as request from 'supertest';

describe('the express middleware', () => {

  let app;
  beforeEach(() => {
    app = createMiddleware();
  });

  describe('on GET /:file', () => {
    it('returns proper status code', () => {
      request(app)
        .get('/file.txt')
        .expect(404);
    });
  });

});
