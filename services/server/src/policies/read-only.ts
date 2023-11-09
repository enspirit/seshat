import { AccessDeniedError } from '@enspirit/seshat-commons';
import { BucketPolicy } from '../types';

export const ReadOnlyPolicy: BucketPolicy = {

  async head(_path): Promise<void> {
  },

  async get(_path): Promise<void> {
  },

  async put(_meta): Promise<void> {
    throw new AccessDeniedError('Access denied.');
  },

  async delete(_path): Promise<void> {
    throw new AccessDeniedError('Access denied.');
  },

  async list(_prefix): Promise<void> {
  },

  async mkdir(_prefix): Promise<void> {
    throw new AccessDeniedError('Access denied.');
  },

};
