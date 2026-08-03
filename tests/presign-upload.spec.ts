import { S3Client } from '@aws-sdk/client-s3';
import { type Storage } from '@google-cloud/storage';
import { Readable } from 'stream';

import * as chai from 'chai';
import { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
chai.use(sinonChai);

import { GCSBucket, LocalBucket, S3Bucket } from '../src/index.js';
import { PresignNotSupportedError } from '../src/errors.js';
import { InvalidPresignRequestError, PresignUploadActionFactory } from '../src/actions/index.js';
import { SecureRename } from '../src/transformers/index.js';
import type {
  ObjectTransformer, ObjectTransformerOutput, SeshatObjectMeta,
} from '../src/types.js';

/**
 * A content transformer: no transformMeta, so presigning must refuse it.
 */
class DummyContentTransformer implements ObjectTransformer {
  type: 'Ingress' = 'Ingress';
  async transform(stream: Readable, meta: SeshatObjectMeta): Promise<ObjectTransformerOutput> {
    return { stream, meta };
  }
}

/**
 * Static credentials and WHEN_REQUIRED, which is what presigning demands.
 * aws-sdk-client-mock is deliberately not used here: getSignedUrl signs locally
 * from the client's config and never reaches client.send(), so a mocked client
 * sees nothing. Asserting on the URL the signer produces is the real test.
 */
const presignableClient = () => new S3Client({
  region: 'eu-west1',
  credentials: { accessKeyId: 'access-key', secretAccessKey: 'secret-key' },
  endpoint: 'http://127.0.0.1:9000',
  forcePathStyle: true,
  requestChecksumCalculation: 'WHEN_REQUIRED',
});

describe('presigned uploads', () => {

  const request = {
    name: 'folder/report.pdf',
    contentType: 'application/pdf',
    contentLength: 4823910,
    expiresIn: 900,
  };

  describe('S3Bucket', () => {

    let bucket: S3Bucket;
    beforeEach(() => {
      bucket = new S3Bucket({ bucket: 'seshat-bucket', s3client: presignableClient() });
    });

    it('signs a PUT url for the object', async () => {
      const presigned = await bucket.presignUpload(request);

      expect(presigned.method).to.equal('PUT');
      expect(presigned.name).to.equal('folder/report.pdf');
      const url = new URL(presigned.url);
      expect(url.pathname).to.equal('/seshat-bucket/folder/report.pdf');
      expect(url.searchParams.get('X-Amz-Expires')).to.equal('900');
      expect(url.searchParams.get('X-Amz-Signature')).to.be.a('string');
    });

    // Without signableHeaders the signature covers content-length and host only,
    // which would let a caller declare any content-type it liked.
    it('binds content-type and content-length into the signature', async () => {
      const presigned = await bucket.presignUpload(request);

      const signed = decodeURIComponent(
        new URL(presigned.url).searchParams.get('X-Amz-SignedHeaders') as string).split(';');
      expect(signed).to.include('content-type');
      expect(signed).to.include('content-length');
    });

    // The SDK defaults to computing a request checksum, which at signing time is
    // taken over an empty body and would make the real upload fail.
    it('does not bind a checksum of the empty signing-time body', async () => {
      const presigned = await bucket.presignUpload(request);

      expect(new URL(presigned.url).searchParams.get('x-amz-checksum-crc32')).to.equal(null);
    });

    it('refuses a client that would compute request checksums', async () => {
      const checksumming = new S3Bucket({
        bucket: 'seshat-bucket',
        s3client: new S3Client({
          region: 'eu-west1',
          credentials: { accessKeyId: 'access-key', secretAccessKey: 'secret-key' },
        }),
      });

      await expect(checksumming.presignUpload(request))
        .to.be.rejectedWith(PresignNotSupportedError, /requestChecksumCalculation/);
    });

    it('refuses an SSE-C encrypted bucket', async () => {
      const encrypted = new S3Bucket({
        bucket: 'seshat-bucket',
        s3client: presignableClient(),
        encryption: { alg: 'AES256', key: 'a'.repeat(32) },
      });

      await expect(encrypted.presignUpload(request))
        .to.be.rejectedWith(PresignNotSupportedError, /encryption key/);
    });

    it('returns only the headers the client must replay', async () => {
      const presigned = await bucket.presignUpload({ ...request, metadata: { ttl: '3600' } });

      expect(presigned.headers).to.have.keys(['content-type', 'content-length']);
      expect(presigned.headers['content-length']).to.equal('4823910');
      // metadata rides in the query string, already covered by the signature
      expect(new URL(presigned.url).searchParams.get('x-amz-meta-ttl')).to.equal('3600');
    });

    // Custom metadata is caller-supplied. Landing it on top of the derived
    // fields would let `name` move the object key out of the path the request
    // addressed, and `contentLength` replace the value the action just checked
    // against its ceiling.
    it('does not let custom metadata override the derived fields', async () => {
      const presigned = await bucket.presignUpload({
        ...request,
        metadata: {
          name: '../../escaped.pdf',
          contentType: 'text/html',
          contentLength: '999999999',
        } as unknown as Record<string, string>,
      });

      expect(presigned.name).to.equal('folder/report.pdf');
      expect(presigned.headers['content-type']).to.equal('application/pdf');
      expect(presigned.headers['content-length']).to.equal('4823910');
      expect(new URL(presigned.url).pathname).to.equal('/seshat-bucket/folder/report.pdf');
    });

    // expiresIn is optional on PresignedUploadRequest, so a direct caller may
    // omit it. Left uncovered that produced an Invalid Date expiresAt and let
    // the AWS SDK apply its own 3600 rather than Seshat's default.
    it('falls back to the default lifetime when none is given', async () => {
      const presigned = await bucket.presignUpload({
        name: 'folder/report.pdf', contentType: 'application/pdf', contentLength: 4823910,
      });

      expect(new URL(presigned.url).searchParams.get('X-Amz-Expires')).to.equal('900');
      expect(Number.isNaN(presigned.expiresAt.getTime())).to.equal(false);
    });
  });

  describe('GCSBucket', () => {

    /**
     * The GCS client signs over the network-free path too, but through a File
     * handle rather than a command object, so the seam worth pinning is the
     * options this bucket hands getSignedUrl - and the headers it tells the
     * client to replay, which unlike S3 must carry the metadata.
     */
    let getSignedUrl: sinon.SinonStub;
    let file: sinon.SinonStub;
    let client: Storage;

    const signedOptions = () => getSignedUrl.firstCall.args[0];

    const gcsBucket = (config: Record<string, unknown> = {}) => new GCSBucket({
      bucket: 'seshat-bucket', client, ...config,
    });

    beforeEach(() => {
      getSignedUrl = sinon.stub().resolves(['https://storage.googleapis.com/signed-url']);
      file = sinon.stub().returns({ getSignedUrl });
      client = { bucket: sinon.stub().returns({ file }) } as unknown as Storage;
    });

    it('signs a write url for the object', async () => {
      const presigned = await gcsBucket().presignUpload(request);

      expect(client.bucket).to.have.been.calledWith('seshat-bucket');
      expect(file).to.have.been.calledWith('folder/report.pdf');
      expect(signedOptions()).to.include({
        version: 'v4',
        action: 'write',
        contentType: 'application/pdf',
      });
      expect(presigned.url).to.equal('https://storage.googleapis.com/signed-url');
      expect(presigned.method).to.equal('PUT');
      expect(presigned.name).to.equal('folder/report.pdf');
    });

    it('signs against the bucket prefix', async () => {
      await gcsBucket({ prefix: 'tenant-a/' }).presignUpload(request);

      expect(file).to.have.been.calledWith('tenant-a/folder/report.pdf');
    });

    it('binds content-length and custom metadata as extension headers', async () => {
      await gcsBucket().presignUpload({ ...request, metadata: { ttl: '3600' } });

      expect(signedOptions().extensionHeaders).to.deep.equal({
        'content-length': '4823910',
        'x-goog-meta-ttl': '3600',
      });
    });

    // Unlike S3's signer, GCS keeps every signed header a header, so the client
    // has to replay the metadata too - dropping it would fail the signature.
    it('returns every signed header for the client to replay', async () => {
      const presigned = await gcsBucket().presignUpload({ ...request, metadata: { ttl: '3600' } });

      expect(presigned.headers).to.deep.equal({
        'content-type': 'application/pdf',
        'content-length': '4823910',
        'x-goog-meta-ttl': '3600',
      });
    });

    it('expires the url at the requested lifetime', async () => {
      const presigned = await gcsBucket().presignUpload({ ...request, expiresIn: 600 });

      expect(signedOptions().expires).to.equal(presigned.expiresAt.getTime());
      expect(presigned.expiresAt.getTime() - Date.now()).to.be.closeTo(600 * 1000, 5000);
    });

    it('falls back to the default lifetime when none is given', async () => {
      const presigned = await gcsBucket().presignUpload({
        name: 'folder/report.pdf', contentType: 'application/pdf', contentLength: 4823910,
      });

      expect(Number.isNaN(presigned.expiresAt.getTime())).to.equal(false);
      expect(presigned.expiresAt.getTime() - Date.now()).to.be.closeTo(900 * 1000, 5000);
    });

    it('applies name transformers to the object being signed', async () => {
      const presigned = await gcsBucket({ transformers: [new SecureRename()] }).presignUpload(request);

      expect(presigned.name).to.match(/^folder\/.+\.pdf$/);
      expect(file).to.have.been.calledWith(presigned.name);
      // the user-facing name must survive as metadata, or Egress rename breaks
      expect(signedOptions().extensionHeaders['x-goog-meta-originalname'])
        .to.equal('folder%2Freport.pdf');
    });

    it('does not let custom metadata override the derived fields', async () => {
      const presigned = await gcsBucket().presignUpload({
        ...request,
        metadata: {
          name: '../../escaped.pdf',
          contentType: 'text/html',
          contentLength: '999999999',
        } as unknown as Record<string, string>,
      });

      expect(presigned.name).to.equal('folder/report.pdf');
      expect(file).to.have.been.calledWith('folder/report.pdf');
      expect(signedOptions().contentType).to.equal('application/pdf');
      expect(signedOptions().extensionHeaders['content-length']).to.equal('4823910');
    });

    it('refuses a bucket carrying a content transformer', async () => {
      await expect(gcsBucket({ transformers: [new DummyContentTransformer()] }).presignUpload(request))
        .to.be.rejectedWith(PresignNotSupportedError, /DummyContentTransformer/);
      // eslint-disable-next-line no-unused-expressions
      expect(getSignedUrl).to.not.have.been.called;
    });
  });

  describe('policies and transformers', () => {

    it('applies name transformers to the object being signed', async () => {
      const bucket = new S3Bucket({
        bucket: 'seshat-bucket',
        s3client: presignableClient(),
        transformers: [new SecureRename()],
      });

      const presigned = await bucket.presignUpload(request);

      expect(presigned.name).to.not.equal('folder/report.pdf');
      expect(presigned.name).to.match(/^folder\/.+\.pdf$/);
      // the user-facing name must survive as metadata, or Egress rename breaks
      expect(new URL(presigned.url).searchParams.get('x-amz-meta-originalname'))
        .to.equal('folder%2Freport.pdf');
    });

    it('runs policies against the pre-rename meta, as put() does', async () => {
      const policy = {
        head: sinon.stub().resolves(), get: sinon.stub().resolves(),
        put: sinon.stub().resolves(), delete: sinon.stub().resolves(),
        list: sinon.stub().resolves(), mkdir: sinon.stub().resolves(),
      };
      const bucket = new S3Bucket({
        bucket: 'seshat-bucket',
        s3client: presignableClient(),
        policies: [policy],
        transformers: [new SecureRename()],
      });

      await bucket.presignUpload(request);

      // eslint-disable-next-line no-unused-expressions
      expect(policy.put).to.have.been.calledOnce;
      expect(policy.put.firstCall.args[0]).to.include({
        name: 'folder/report.pdf',
        contentType: 'application/pdf',
        contentLength: 4823910,
      });
    });

    it('refuses a bucket carrying a content transformer', async () => {
      const bucket = new S3Bucket({
        bucket: 'seshat-bucket',
        s3client: presignableClient(),
        transformers: [new DummyContentTransformer()],
      });

      await expect(bucket.presignUpload(request))
        .to.be.rejectedWith(PresignNotSupportedError, /DummyContentTransformer/);
    });
  });

  describe('LocalBucket', () => {

    it('refuses: a filesystem has no signing authority', async () => {
      const bucket = new LocalBucket({ path: import.meta.dirname });

      await expect(bucket.presignUpload(request))
        .to.be.rejectedWith(PresignNotSupportedError, /does not support presigned uploads/);
    });
  });

  describe('the presign-upload action', () => {

    let bucket: { presignUpload: sinon.SinonStub };
    const req = (body: any, path = '/') => ({ path, body, seshat: { bucket } }) as any;

    beforeEach(() => {
      bucket = { presignUpload: sinon.stub().resolves({}) };
    });

    it('passes a valid request through to the bucket', async () => {
      const action = PresignUploadActionFactory();

      await action.run(req({ filename: 'r.pdf', contentType: 'application/pdf', contentLength: 31 }, '/docs/'));

      expect(bucket.presignUpload.firstCall.args[0]).to.deep.include({
        name: 'docs/r.pdf',
        contentType: 'application/pdf',
        contentLength: 31,
        expiresIn: 900,
      });
    });

    // The same Express 5 mount-path handling the routers needed: '/docs//'
    // must address docs/, not a nested empty segment.
    it('normalises a doubled slash after the mount path', async () => {
      const action = PresignUploadActionFactory();

      await action.run(req({ filename: 'r.pdf', contentType: 'application/pdf', contentLength: 31 }, '//'));

      expect(bucket.presignUpload.firstCall.args[0].name).to.equal('r.pdf');
    });

    const rejects = (body: any, match: RegExp) => async () => {
      const action = PresignUploadActionFactory();
      await expect(action.run(req(body))).to.be.rejectedWith(InvalidPresignRequestError, match);
    };

    it('rejects a missing filename', rejects(
      { contentType: 'application/pdf', contentLength: 1 }, /filename/));

    it('rejects a missing contentType', rejects(
      { filename: 'r.pdf', contentLength: 1 }, /contentType/));

    it('rejects a missing contentLength', rejects(
      { filename: 'r.pdf', contentType: 'application/pdf' }, /contentLength/));

    it('rejects a zero contentLength', rejects(
      { filename: 'r.pdf', contentType: 'application/pdf', contentLength: 0 }, /contentLength/));

    it('rejects a non-integer contentLength', rejects(
      { filename: 'r.pdf', contentType: 'application/pdf', contentLength: 1.5 }, /contentLength/));

    it('rejects a contentLength above the configured ceiling', async () => {
      const action = PresignUploadActionFactory({
        defaultExpiresIn: 900, maxExpiresIn: 3600, maxContentLength: 1024,
      });

      await expect(action.run(req({ filename: 'r.pdf', contentType: 'application/pdf', contentLength: 2048 })))
        .to.be.rejectedWith(InvalidPresignRequestError, /maximum of 1024 bytes/);
    });

    // Refused, not silently shortened: a caller that asked for a day-long URL
    // should learn it did not get one.
    it('rejects rather than clamps an over-long expiresIn', rejects(
      { filename: 'r.pdf', contentType: 'application/pdf', contentLength: 1, expiresIn: 86400 },
      /maximum of 3600 seconds/));

    it('rejects non-object metadata', rejects(
      { filename: 'r.pdf', contentType: 'application/pdf', contentLength: 1, metadata: 'nope' }, /metadata/));

    it('rejects array metadata', rejects(
      { filename: 'r.pdf', contentType: 'application/pdf', contentLength: 1, metadata: ['nope'] }, /metadata/));

    it('rejects null metadata', rejects(
      { filename: 'r.pdf', contentType: 'application/pdf', contentLength: 1, metadata: null }, /metadata/));

    // Backends stringify metadata with `.toString()`, which a null answers with
    // a TypeError - a 500 on input the client controls, where the contract the
    // error message states calls for a 400.
    it('rejects a null metadata value', rejects(
      { filename: 'r.pdf', contentType: 'application/pdf', contentLength: 1, metadata: { foo: null } },
      /'metadata\.foo' must be a string, got null/));

    it('rejects a non-string metadata value', rejects(
      { filename: 'r.pdf', contentType: 'application/pdf', contentLength: 1, metadata: { foo: { bar: 1 } } },
      /'metadata\.foo' must be a string, got object/));

    it('passes string metadata through', async () => {
      const action = PresignUploadActionFactory();

      await action.run(req({
        filename: 'r.pdf', contentType: 'application/pdf', contentLength: 31, metadata: { ttl: '3600' },
      }));

      expect(bucket.presignUpload.firstCall.args[0].metadata).to.deep.equal({ ttl: '3600' });
    });
  });

  describe('SecureRename.transformMeta', () => {

    // Guards the refactor: transform() must stay a thin wrapper over transformMeta.
    it('agrees with transform() on Ingress', async () => {
      const rename = new SecureRename({ nameGenerator: async () => 'fixed-name' });
      const meta: SeshatObjectMeta = { name: 'a/b.pdf', contentType: 'application/pdf' };

      const viaTransform = await rename.transform(Readable.from(['x']), meta, 'Ingress');
      const viaMeta = await rename.transformMeta(meta, 'Ingress');

      expect(viaMeta).to.deep.equal(viaTransform.meta);
      expect(viaMeta.name).to.equal('a/fixed-name.pdf');
      expect(viaMeta.originalname).to.equal('a/b.pdf');
    });

    it('agrees with transform() on Egress', async () => {
      const rename = new SecureRename();
      const meta: SeshatObjectMeta = {
        name: 'a/fixed-name.pdf', contentType: 'application/pdf', originalname: 'a/b.pdf',
      };

      const viaTransform = await rename.transform(Readable.from(['x']), meta, 'Egress');
      const viaMeta = await rename.transformMeta(meta, 'Egress');

      expect(viaMeta).to.deep.equal(viaTransform.meta);
      expect(viaMeta.name).to.equal('a/b.pdf');
      expect(viaMeta.originalname).to.equal(undefined);
    });

    // A presigned upload whose metadata never made it would otherwise come back
    // from Egress with name undefined.
    it('keeps the stored name when originalname is absent', async () => {
      const rename = new SecureRename();
      const meta: SeshatObjectMeta = { name: 'a/fixed-name.pdf', contentType: 'application/pdf' };

      const result = await rename.transformMeta(meta, 'Egress');

      expect(result.name).to.equal('a/fixed-name.pdf');
    });
  });
});
