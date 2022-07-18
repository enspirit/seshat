import * as request from 'supertest';
import * as chai from 'chai';
import { expect } from 'chai';
import * as sinonChai from 'sinon-chai';
import * as sinon from 'sinon';
chai.use(sinonChai);

import mockBucket from '../mocks/bucket';

import seshatRequestMiddleware from '../../src/middlewares/seshat-request';
import { SeshatConfig } from '../../src';

describe('the seshat-request middleware', () => {

  let mw;
  let config: SeshatConfig;
  let mockRequest, mockResponse, next;
  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {};
    next = sinon.stub();
    config = {
      bucket: mockBucket,
    };
    mw = seshatRequestMiddleware(config);
  });

  it('decorates request with a seshatRequest object', () => {
    mw(mockRequest, mockResponse, next);
    expect(mockRequest.seshat).to.be.an('object');
  });

});
