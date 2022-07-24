import { AccessDeniedError } from '../errors';
import { SeshatBucketPolicy } from '../types';

const ReadOnlyPolicy: SeshatBucketPolicy = {

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

};

export default ReadOnlyPolicy;
