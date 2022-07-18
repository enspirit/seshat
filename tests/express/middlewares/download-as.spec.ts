import * as chai from 'chai';
import { expect } from 'chai';
import { Request, Response, NextFunction } from 'express';
import * as sinonChai from 'sinon-chai';
import { default as downloadAsMw } from '../../../src/express/middlewares/download-as';
import * as sinon from 'sinon';
chai.use(sinonChai);

describe('the download-as express middleware', () => {

  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let next: Partial<NextFunction>;

  describe('with used with default options', () => {
    beforeEach(() => {
      mockRequest = {
        query: {
          n: 'file.txt'
        }
      };
      mockResponse = {
        setHeader: sinon.stub()
      };
      next = sinon.stub();
    })

    it('calls the next() function', () => {
      const mw = downloadAsMw();
      mw(mockRequest as Request, mockResponse as Response, next as NextFunction);
      expect(next).to.be.calledOnceWith();
    });

    it('sets the proper header', () => {
      const mw = downloadAsMw();
      mw(mockRequest as Request, mockResponse as Response, next as NextFunction);
      expect(mockResponse.setHeader).to.be.calledOnceWith('Content-Disposition', 'attachment; filename=file.txt');
    });

    it('does not set any header when not finding the query param', () => {
      const mw = downloadAsMw();
      delete mockRequest.query.n;
      mw(mockRequest as Request, mockResponse as Response, next as NextFunction);
      expect(mockResponse.setHeader).to.not.be.called;
    });
  });

  describe('with custom options', () => {

    let options = { queryParam: 'filename' };
    beforeEach(() => {
      mockRequest = {
        query: {
          filename: 'report.pdf'
        }
      };
      mockResponse = {
        setHeader: sinon.stub()
      };
      next = sinon.stub();
    })

    it('calls the next() function', () => {
      const mw = downloadAsMw(options);
      mw(mockRequest as Request, mockResponse as Response, next as NextFunction);
      expect(next).to.be.calledOnceWith();
    });

    it('sets the proper header', () => {
      const mw = downloadAsMw(options);
      mw(mockRequest as Request, mockResponse as Response, next as NextFunction);
      expect(mockResponse.setHeader).to.be.calledOnceWith('Content-Disposition', 'attachment; filename=report.pdf');
    });

    it('does not set any header when not finding the query param', () => {
      const mw = downloadAsMw(options);
      delete mockRequest.query.filename;
      mw(mockRequest as Request, mockResponse as Response, next as NextFunction);
      expect(mockResponse.setHeader).to.not.be.called;
    });
  });

});
