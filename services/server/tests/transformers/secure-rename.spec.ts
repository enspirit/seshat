import { expect } from 'chai';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { Object, ObjectTransformer, ObjectTransformerOutput, SecureRename } from '../../src';
import { ObjectMeta } from '@enspirit/seshat-commons';
chai.use(chaiAsPromised);

import { getMockFileObject } from '../mocks/object';

describe('SecureRename', () => {

  let transformer: ObjectTransformer;
  let mockFileObject: Object;
  beforeEach(async () => {
    mockFileObject = getMockFileObject();
    transformer = new SecureRename();
  });

  describe('when used in Ingress mode', () => {

    let metadata: ObjectMeta;
    beforeEach(() => {
      metadata = {
        name: 'test.json',
        contentType: 'application/json',
      };
    });

    describe('.transform', () => {

      it('does not alter the stream', async () => {
        const output: ObjectTransformerOutput = await transformer.transform(mockFileObject.body, metadata, 'Ingress');
        expect(output.stream).to.equal(mockFileObject.body);
      });

      it('does rename the object with a secure name', async () => {
        const output: ObjectTransformerOutput = await transformer.transform(mockFileObject.body, metadata, 'Ingress');
        expect(output.meta.name).to.not.equal(metadata.name);
      });

      it('adds the original name to the object metadata', async () => {
        const output: ObjectTransformerOutput = await transformer.transform(mockFileObject.body, metadata, 'Ingress');
        expect(output.meta.originalname).to.equal(metadata.name);
      });

      it('does keep prefix when configured to do so', async () => {
        metadata.name = 'prefix/subprefix/test.csv';
        transformer = new SecureRename({ keepPrefix: true });
        const output: ObjectTransformerOutput = await transformer.transform(mockFileObject.body, metadata, 'Ingress');
        expect(output.meta.name).to.include('prefix/subprefix/');
      });

      it('does hide the prefix when configured to do so', async () => {
        transformer = new SecureRename({ keepPrefix: false });
        metadata.name = 'prefix/subprefix/test.csv';
        const output: ObjectTransformerOutput = await transformer.transform(mockFileObject.body, metadata, 'Ingress');
        expect(output.meta.name).to.not.include('prefix/subprefix/');
      });

      it('does keep extension when configured to do so', async () => {
        metadata.name = 'prefix/subprefix/test.csv';
        transformer = new SecureRename({ keepExtension: true });
        const output: ObjectTransformerOutput = await transformer.transform(mockFileObject.body, metadata, 'Ingress');
        expect(output.meta.name.endsWith('.csv')).to.equal(true);
      });

      it('does hide the prefix when configured to do so', async () => {
        transformer = new SecureRename({ keepExtension: false });
        metadata.name = 'prefix/subprefix/test.csv';
        const output: ObjectTransformerOutput = await transformer.transform(mockFileObject.body, metadata, 'Ingress');
        expect(output.meta.name.endsWith('.csv')).to.equal(false);
      });

    });

  });

  describe('when used in Egress mode', () => {

    describe('.transform', () => {

      const metadata: ObjectMeta = {
        name: 'c4ExbEoiPKTlsU-k4wlupg==',
        originalname: 'test.json',
        contentType: 'application/json',
      };

      it('does not alter the stream', async () => {
        const output: ObjectTransformerOutput = await transformer.transform(mockFileObject.body, metadata, 'Egress');
        expect(output.stream).to.equal(mockFileObject.body);
      });

      it('does rename the object with its original name', async () => {
        const output: ObjectTransformerOutput = await transformer.transform(mockFileObject.body, metadata, 'Egress');
        expect(output.meta.name).to.equal(metadata.originalname);
      });

      it('remove the original name from the object metadata', async () => {
        const output: ObjectTransformerOutput = await transformer.transform(mockFileObject.body, metadata, 'Egress');
        expect(output.meta).to.not.have.property('originalname');
      });

    });

  });

});
