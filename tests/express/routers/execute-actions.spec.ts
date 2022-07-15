import request from 'supertest';
import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { createRouter } from '../../../src/express/routers/execute-actions';
import mockBucket from '../../mocks/bucket';
import middlewares from '../../../src/express/middlewares';
import { SeshatAction, SeshatConfig } from '../../../src/types';
import { ObjectNotFoundError } from '../../../src/errors';
chai.use(sinonChai);

import express from 'express';

describe.skip('the execute-actions express router', () => {

  const testAction: SeshatAction = {
    name: 'test',
    options: {},
    run() {
      return Promise.resolve();
    },
  };

  let config: SeshatConfig;

  let router;
  let app;
  beforeEach(() => {
    config = {
      bucket: mockBucket,
      actions: [testAction],
    };
    router = createRouter(config);

    app = express();
    app.use(middlewares.map(mw => mw(config)));
    app.use(router);
  });

  describe('when used with default options', () => {

    describe('when POSTing but not sending the special action header', () => {

      it('passes its turn and let other routes match', () => {
        return request(app)
          .post('/subfolder')
          .expect(404);
      });

    });

    describe('when POSTing with the special action header', () => {

      it('complains when the action name is missing from the headers', async () => {
        const response = await request(app)
          .post('/subfolder')
          .set({ 'Content-Type': 'application/vnd.seshat-action+json' })
          .expect(400)
          .expect('Content-Type', /json/);

        return expect(response.body.error).to.match(/Missing 'action' parameter/);
      });

      it('complains when the action is unknown', async () => {
        const response = await request(app)
          .post('/subfolder')
          .set({ 'Content-Type': 'application/vnd.seshat-action+json' })
          .set({ 'Seshat-Action': 'foo-bar' })
          .expect('Content-Type', /json/)
          .expect(400);
        return expect(response.body.error).to.match(/Unknown action/);
      });

      it('it runs the action properly', async () => {
        const spy = sinon.spy(testAction, 'run');

        await request(app)
          .post('/subfolder')
          .set({ 'Content-Type': 'application/vnd.seshat-action+json' })
          .set({ 'Seshat-Action': 'test' })
          .expect(200);

        // eslint-disable-next-line no-unused-expressions
        expect(spy).to.be.calledOnce;
      });

      describe('when faced with action errors', () => {

        it('it serves 404 properly for ObjectNotFoundError', async () => {
          testAction.run = sinon.stub().rejects(new ObjectNotFoundError('Object not found'));

          const response = await request(app)
            .post('/subfolder')
            .set({ 'Content-Type': 'application/vnd.seshat-action+json' })
            .set({ 'Seshat-Action': 'test' })
            .expect(404);

          expect(response.body.error).to.match(/Object not found/);
        });

      });

    });

  });

});
