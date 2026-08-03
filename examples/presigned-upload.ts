import { type Express } from 'express';
import { S3Client } from '@aws-sdk/client-s3';
import { createApp, S3Bucket } from '../src/index.js';
import { s3client } from './s3.js';
import { ExecuteActions, RetrieveObjects, ListObjects } from '../src/express/routers/index.js';
import { PresignUploadAction } from '../src/actions/index.js';
import { SecureRename } from '../src/transformers/index.js';

/**
 * Presigned uploads: the client PUTs its bytes straight at the storage backend,
 * so they never travel through this process at all.
 *
 * Worth uploading a file that way when it is large, or when whoever holds the
 * bytes (a browser, an agent on someone's laptop) can make an HTTP request but
 * must not be handed bucket credentials.
 *
 * Two consequences to weigh before reaching for it:
 *
 *   - Transformers that rewrite content cannot run. Seshat never sees the bytes,
 *     so it cannot scan, resize or compress them. A bucket carrying such a
 *     transformer refuses to presign rather than quietly dropping the guarantee.
 *     Name-only transformers such as SecureRename are fine, and still apply.
 *
 *   - The `stored` event does not fire, because this process never learns
 *     whether the upload happened. Callers that need to know should HEAD the
 *     object afterwards, using the `name` the presign response returned.
 *
 * Two legs:
 *
 *   curl -X POST http://localhost:3000/presigned/ \
 *     -H 'content-type: application/vnd.seshat-action+json' \
 *     -H 'seshat-action: presign-upload' \
 *     -d '{"filename":"report.pdf","contentType":"application/pdf","contentLength":4823910}'
 *
 * then, with the url and headers that came back:
 *
 *   curl -X PUT "<url>" \
 *     -H 'content-type: application/pdf' \
 *     -H 'content-length: 4823910' \
 *     --data-binary @report.pdf
 */
export default (expressApp: Express) => {

  expressApp.use('/presigned', createApp({
    bucket: new S3Bucket({
      // reads and writes go over the network this process sits on...
      s3client,
      // ...while the signed URL has to name an address its holder can reach
      presignClient: presignableClient,
      bucket: 'my-s3-bucket',
      transformers: [new SecureRename()],
    }),
    routers: [
      ExecuteActions([PresignUploadAction]),
      RetrieveObjects(),
      ListObjects(),
    ],
  }));

};

/**
 * Note `requestChecksumCalculation`. Left at its default the SDK computes a
 * checksum of the request body and the signer binds it into the URL - but at
 * signing time that body is empty, so the checksum describes nothing and the
 * real upload is rejected on arrival. A bucket given a client without this
 * setting refuses to presign rather than handing out URLs that fail later.
 */
export const presignableClient = new S3Client({
  region: 'eu-west1',
  credentials: {
    accessKeyId: 'access-key',
    secretAccessKey: 'secret-key',
  },
  // The endpoint here is the one the *client* will connect to, which is not
  // necessarily the one this process uses. A signature covers the Host header,
  // so signing against an address the client cannot reach produces a URL that
  // is either unroutable or rejected. In docker that means the published
  // address rather than the compose network name.
  endpoint: process.env.S3_PUBLIC_ENDPOINT || process.env.S3_ENDPOINT || 'http://127.0.0.1:9000',
  forcePathStyle: true,
  requestChecksumCalculation: 'WHEN_REQUIRED',
});
