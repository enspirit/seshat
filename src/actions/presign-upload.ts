import path from 'path';
import { type Request } from 'express';
import { DefaultPresignExpiresIn, type Action, type PresignedUpload } from '../types.js';
import { SeshatError } from '../errors.js';
import { requestPath } from '../utils/index.js';

export class InvalidPresignRequestError extends SeshatError {
  httpCode = 400;
}

export type PresignUploadOptions = {
  /** Seconds granted when the caller does not ask for a specific lifetime. */
  defaultExpiresIn: number
  /** Seconds. Requests above this are refused, not quietly shortened. */
  maxExpiresIn: number
  /**
   * Bytes. Undefined leaves the ceiling to the deployment - a reverse proxy, or
   * the bucket's own limits. Set it here when the signed URL is the only thing
   * standing between a caller and your storage bill.
   */
  maxContentLength?: number
}

const DefaultOptions: PresignUploadOptions = {
  defaultExpiresIn: DefaultPresignExpiresIn,
  maxExpiresIn: 3600,
};

const requireString = (value: unknown, field: string): string => {
  if (typeof value !== 'string' || value.length === 0) {
    throw new InvalidPresignRequestError(`'${field}' is required and must be a non-empty string`);
  }
  return value;
};

/**
 * Backends turn every metadata value into a string on the way out, and reach
 * for `.toString()` to do it - which a null value answers with a TypeError, and
 * a nested object with '[object Object]'. Neither belongs in a 500, so the
 * contract the error message already stated is enforced here instead.
 */
const requireStringValues = (metadata: unknown): Record<string, string> | undefined => {
  if (metadata === undefined) {
    return undefined;
  }
  if (typeof metadata !== 'object' || metadata === null || Array.isArray(metadata)) {
    throw new InvalidPresignRequestError('\'metadata\' must be an object of string values');
  }
  for (const [key, value] of Object.entries(metadata)) {
    if (typeof value !== 'string') {
      throw new InvalidPresignRequestError(
        `'metadata.${key}' must be a string, got ${value === null ? 'null' : typeof value}`);
    }
  }
  return metadata as Record<string, string>;
};

export const PresignUploadActionFactory = (options: PresignUploadOptions = DefaultOptions): Action => {
  const config = { ...DefaultOptions, ...options };

  return {
    name: 'presign-upload',
    run: async (req: Request): Promise<PresignedUpload> => {
      const { filename, contentType, contentLength, expiresIn, metadata } = req.body || {};

      requireString(filename, 'filename');
      requireString(contentType, 'contentType');

      if (!Number.isInteger(contentLength) || contentLength <= 0) {
        throw new InvalidPresignRequestError('\'contentLength\' is required and must be a positive integer');
      }
      if (config.maxContentLength !== undefined && contentLength > config.maxContentLength) {
        throw new InvalidPresignRequestError(
          `'contentLength' exceeds the maximum of ${config.maxContentLength} bytes`);
      }

      // Refused rather than clamped: a caller that asked for a day-long URL and
      // silently received a fifteen-minute one finds out when the upload fails.
      if (expiresIn !== undefined) {
        if (!Number.isInteger(expiresIn) || expiresIn <= 0) {
          throw new InvalidPresignRequestError('\'expiresIn\' must be a positive integer number of seconds');
        }
        if (expiresIn > config.maxExpiresIn) {
          throw new InvalidPresignRequestError(
            `'expiresIn' exceeds the maximum of ${config.maxExpiresIn} seconds`);
        }
      }

      const entries = requireStringValues(metadata);

      const basePath = decodeURIComponent(requestPath(req).substring(1));
      const bucket = req.seshat.bucket;

      return bucket.presignUpload({
        // Mirrors how MultipartUpload derives object names, so presigning
        // against POST /attachments/ lands where a multipart upload would.
        name: path.join(basePath, filename as string),
        contentType: contentType as string,
        contentLength: contentLength as number,
        expiresIn: expiresIn ?? config.defaultExpiresIn,
        metadata: entries,
      });
    },
  };
};

/**
 * For backward compatibility when actions did not have parameters
 */
export const PresignUploadAction = PresignUploadActionFactory();
