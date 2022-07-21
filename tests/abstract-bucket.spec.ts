import chai from 'chai';
import { expect } from 'chai';
import sinonChai from 'sinon-chai';
import { default as sinon, SinonStub } from 'sinon';
chai.use(sinonChai);

import AbstractBucket from '../src/abstract-bucket';
import { Readable } from 'stream';
import { SeshatBucketPolicy, SeshatObject, SeshatObjectMeta } from '../src/types';
import { mockFileObject } from './mocks/object';
import { readOnlyPolicy, uploadOnlyPolicy } from './mocks/policies';

describe('the AbstractBucket class', () => {

  class ConcreteBucket extends AbstractBucket {
    async _get(_path: string): Promise<SeshatObject> {
      return mockFileObject;
    }
    async _put(_path: string, _stream: Readable, _meta: SeshatObjectMeta): Promise<SeshatObject> {
      return mockFileObject;
    }
    async _delete(_path: string): Promise<void> {
      return;
    }
    async _list(_prefix?: string): Promise<SeshatObject[]> {
      return [mockFileObject];
    }
  }

  const withAllPoliciesSucceeding = () => {
    policies.forEach((policy) => {
      sinon.stub(policy, 'get').resolves();
      sinon.stub(policy, 'put').resolves();
      sinon.stub(policy, 'delete').resolves();
      sinon.stub(policy, 'list').resolves();
    });
  };

  const restorePoliciesDefaults = () => {
    policies.forEach((policy) => {
      (policy.get as SinonStub).restore();
      (policy.put as SinonStub).restore();
      (policy.delete as SinonStub).restore();
      (policy.list as SinonStub).restore();
    });
  };

  let bucket: ConcreteBucket;
  let policies: Array<SeshatBucketPolicy>;
  beforeEach(() => {
    policies = [readOnlyPolicy, uploadOnlyPolicy];
    bucket = new ConcreteBucket(Object.values(policies));
    withAllPoliciesSucceeding();
  });

  afterEach(() => {
    restorePoliciesDefaults();
  });

  describe('put()', () => {

    it('calls the _put() method of the concrete subclass', async () => {
      const spy = sinon.spy(bucket, '_put');
      await bucket.put('/tmp/test.pdf', mockFileObject.getReadableStream(), { mimeType: mockFileObject.contentType });
      expect(spy).to.be.calledOnceWith('/tmp/test.pdf');
    });

    it('lets errors from _put() bubble up', async () => {
      const err = new Error('oops');
      const spy = sinon.stub(bucket, '_put').rejects(err);
      const p = bucket.put('/tmp/test.pdf', mockFileObject.getReadableStream(), { mimeType: mockFileObject.contentType });
      await expect(p).to.be.eventually.rejectedWith(err);
      spy.reset();
    });

    describe('when used with failling policy', () => {

      it('lets the policy error bubble up', async () => {
        const err = new Error('failed-policy');
        (readOnlyPolicy.put as SinonStub).rejects(err);
        const p = bucket.put('/tmp/test.pdf', mockFileObject.getReadableStream(), { mimeType: mockFileObject.contentType });
        await expect(p).to.be.eventually.rejectedWith(err);
      });

    });

  });

  describe('get()', () => {

    it('calls the _get() method of the concrete subclass', async () => {
      const spy = sinon.spy(bucket, '_get');
      await bucket.get('/tmp/test.pdf');
      expect(spy).to.be.calledOnceWith('/tmp/test.pdf');
    });

    it('lets errors from _get() bubble up', async () => {
      const err = new Error('oops');
      const spy = sinon.stub(bucket, '_get').rejects(err);
      const p = bucket.get('/tmp/test.pdf');
      await expect(p).to.be.eventually.rejectedWith(err);
      spy.reset();
    });

    describe('when used with failling policy', () => {

      it('lets the policy error bubble up', async () => {
        const err = new Error('failed-policy');
        (readOnlyPolicy.get as SinonStub).rejects(err);
        const p = bucket.get('/tmp/test.pdf');
        await expect(p).to.be.eventually.rejectedWith(err);
      });

    });

  });

  describe('list()', () => {

    it('calls the _list() method of the concrete subclass', async () => {
      const spy = sinon.spy(bucket, '_list');
      await bucket.list('/tmp');
      expect(spy).to.be.calledOnceWith('/tmp');
    });

    it('lets errors from _list() bubble up', async () => {
      const err = new Error('oops');
      const spy = sinon.stub(bucket, '_list').rejects(err);
      const p = bucket.list('/tmp');
      await expect(p).to.be.eventually.rejectedWith(err);
      spy.reset();
    });

    describe('when used with failling policy', () => {

      it('lets the policy error bubble up', async () => {
        const err = new Error('failed-policy');
        (readOnlyPolicy.list as SinonStub).rejects(err);
        const p = bucket.list('/tmp');
        await expect(p).to.be.eventually.rejectedWith(err);
      });

    });

  });

  describe('delete()', () => {

    it('calls the _delete() method of the concrete subclass', async () => {
      const spy = sinon.spy(bucket, '_delete');
      await bucket.delete('/tmp');
      expect(spy).to.be.calledOnceWith('/tmp');
    });

    it('lets errors from _delete() bubble up', async () => {
      const err = new Error('oops');
      const spy = sinon.stub(bucket, '_delete').rejects(err);
      const p = bucket.delete('/tmp');
      await expect(p).to.be.eventually.rejectedWith(err);
      spy.reset();
    });

    describe('when used with failling policy', () => {

      it('lets the policy error bubble up', async () => {
        const err = new Error('failed-policy');
        (readOnlyPolicy.delete as SinonStub).rejects(err);
        const p = bucket.delete('/tmp/test.pdf');
        await expect(p).to.be.eventually.rejectedWith(err);
      });

    });

  });

});