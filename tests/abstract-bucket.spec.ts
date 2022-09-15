import chai from 'chai';
import { expect } from 'chai';
import sinonChai from 'sinon-chai';
import { default as sinon, SinonStub } from 'sinon';
chai.use(sinonChai);

import AbstractBucket from '../src/abstract-bucket';
import { Readable } from 'stream';
import { BucketPolicy, Object, ObjectMeta, ObjectTransformer, ObjectTransformerType } from '../src/types';
import { getMockFileObject } from './mocks/object';
import { readOnlyPolicy, uploadOnlyPolicy } from './mocks/policies';
import { ObjectTransformerError } from '../src/errors';

describe('the AbstractBucket class', () => {

  class ConcreteBucket extends AbstractBucket {
    async _get(_path: string): Promise<Object> {
      return mockFileObject;
    }
    async _head(_path: string): Promise<ObjectMeta> {
      return mockFileObject.meta;
    }
    async _put(_stream: Readable, _meta: ObjectMeta): Promise<Object> {
      return mockFileObject;
    }
    async _delete(_path: string): Promise<void> {
      return;
    }
    async _list(_prefix?: string): Promise<ObjectMeta[]> {
      return [mockFileObject.meta];
    }
    async _mkdir(_prefix?: string): Promise<void> {
      return;
    }
  }

  const withAllPoliciesSucceeding = () => {
    policies.forEach((policy) => {
      sinon.stub(policy, 'head').resolves();
      sinon.stub(policy, 'get').resolves();
      sinon.stub(policy, 'put').resolves();
      sinon.stub(policy, 'delete').resolves();
      sinon.stub(policy, 'list').resolves();
    });
  };

  const restorePoliciesDefaults = () => {
    policies.forEach((policy) => {
      (policy.head as SinonStub).restore();
      (policy.get as SinonStub).restore();
      (policy.put as SinonStub).restore();
      (policy.delete as SinonStub).restore();
      (policy.list as SinonStub).restore();
    });
  };

  const expectListenerToBeCalledWith = (listener: SinonStub, ...args: any[]) => {
    return new Promise<void>((resolve) => {
      process.nextTick(() => {
        expect(listener).to.be.calledOnceWith(...args);
        resolve();
      });
    });
  };

  const expectListenerToNotBeCalled = (listener: SinonStub) => {
    return new Promise<void>((resolve) => {
      process.nextTick(() => {
        // eslint-disable-next-line no-unused-expressions
        expect(listener).to.not.be.called;
        resolve();
      });
    });
  };

  let bucket: ConcreteBucket;
  let policies: Array<BucketPolicy>;
  let transformers: Array<ObjectTransformer>;
  let mockFileObject: Object;
  let meta: ObjectMeta;
  beforeEach(() => {
    mockFileObject = getMockFileObject();
    meta = { name: 'test.pdf', contentType: mockFileObject.meta.contentType };
    policies = [readOnlyPolicy, uploadOnlyPolicy];
    transformers = [];
    bucket = new ConcreteBucket({
      policies: Object.values(policies),
      transformers,
    });
    withAllPoliciesSucceeding();
  });

  afterEach(() => {
    restorePoliciesDefaults();
  });

  describe('put()', () => {

    it('calls the _put() method of the concrete subclass', async () => {
      const spy = sinon.spy(bucket, '_put');

      const stream = mockFileObject.body;
      await bucket.put(stream, meta);
      expect(spy).to.be.calledOnceWith(stream, meta);
    });

    it('lets errors from _put() bubble up', async () => {
      const err = new Error('oops');
      const spy = sinon.stub(bucket, '_put').rejects(err);

      const p = bucket.put(mockFileObject.body, meta);
      await expect(p).to.be.eventually.rejectedWith(err);
      spy.reset();
    });

    describe('when subscribing to the stored event', () => {

      it('calls the listener when a file is successfully stored', async () => {
        const listener = sinon.stub().resolves();
        bucket.on('stored', listener);
        await bucket.put(mockFileObject.body, meta);
        await expectListenerToBeCalledWith(listener, meta);
      });

      it('implements truly async events', async () => {
        const listener = sinon.stub().resolves();
        bucket.on('stored', listener);
        await bucket.put(mockFileObject.body, meta);
        // eslint-disable-next-line no-unused-expressions
        expect(listener).to.not.be.called;
      });

      it('does not call the event listener when storing object fails', async () => {
        const _put = sinon.stub(bucket, '_put').rejects(new Error('oops'));
        const listener = sinon.stub().resolves();
        bucket.on('stored', listener);
        try {
          await bucket.put(mockFileObject.body, meta);
        } catch (err) {
          //
        }
        await expectListenerToNotBeCalled(listener);
      });

    });

    describe('when used with failling policy', () => {

      let err: Error;
      beforeEach(() => {
        err = new Error('failed-policy');
        (readOnlyPolicy.put as SinonStub).rejects(err);
      });

      it('lets the policy error bubble up', async () => {
        const p = bucket.put(mockFileObject.body, meta);
        await expect(p).to.be.eventually.rejectedWith(err);
      });

      it('does not call the event listeners', async () => {
        const listener = sinon.stub().resolves();
        bucket.on('stored', listener);
        try {
          await bucket.put(mockFileObject.body, meta);
        } catch (err) {
          //
        }
        await expectListenerToNotBeCalled(listener);
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

      let err: Error;
      beforeEach(() => {
        err = new Error('failed-policy');
        (readOnlyPolicy.delete as SinonStub).rejects(err);
      });

      it('lets the policy error bubble up', async () => {
        const p = bucket.delete('/tmp/test.pdf');
        await expect(p).to.be.eventually.rejectedWith(err);
      });

      it('does not call the event listeners', async () => {
        const listener = sinon.stub().resolves();
        bucket.on('deleted', listener);
        try {
          await bucket.delete('/tmp/test.pdf');
        } catch (err) {
          //
        }
        await expectListenerToNotBeCalled(listener);
      });

    });

    describe('when subscribing to the deleted event', () => {

      it('calls the listener when a file is successfully deleted', async () => {
        const listener = sinon.stub().resolves();
        bucket.on('deleted', listener);
        await bucket.delete('/tmp/test.pdf');
        await expectListenerToBeCalledWith(listener, '/tmp/test.pdf');
      });

      it('implements truly async events', async () => {
        const listener = sinon.stub().resolves();
        bucket.on('deleted', listener);
        await bucket.delete('tmp/test.pdf');
        // eslint-disable-next-line no-unused-expressions
        expect(listener).to.not.be.called;
      });

      it('does not call the event listener when deleting object fails', async () => {
        const _put = sinon.stub(bucket, '_delete').rejects(new Error('oops'));
        const listener = sinon.stub().resolves();
        bucket.on('deleted', listener);
        try {
          await bucket.delete('/tmp/test.pdf');
        } catch (err) {
          //
        }
        await expectListenerToNotBeCalled(listener);
      });

    });
  });

  describe('when used with transformers', () => {

    class DummyIngressTransformer implements ObjectTransformer {
      type: ObjectTransformerType = 'Ingress';
      async transform(stream: Readable, meta: ObjectMeta) {
        return { stream, meta };
      }
    }

    let ingress: ObjectTransformer;
    beforeEach(() => {
      ingress = new DummyIngressTransformer();
      transformers.push(ingress);
    });

    describe('put()', () => {
      it('calls the transformers', async () => {
        const spy = sinon.spy(ingress, 'transform');
        const stream = mockFileObject.body;

        await bucket.put(stream, meta);
        expect(spy).to.be.calledOnceWith(stream, meta);
      });

      it('catches transformer errors and wraps them into ObjectTransformerError', async () => {
        const stub = sinon.stub(ingress, 'transform');
        const error = new Error('a transforming error occured');
        stub.rejects(error);
        const stream = mockFileObject.body;

        const p = bucket.put(stream, meta);
        return expect(p).to.be.rejectedWith(ObjectTransformerError, /Object transformer failed: DummyIngressTransformer/);
      });
    });

  });

});

