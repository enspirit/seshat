import { SeshatBucketPolicy, SeshatObjectMeta } from '../../src/types';

export const readOnlyPolicy: SeshatBucketPolicy = {

  async get(_path: string): Promise<void> {
  },

  async put(_path: string, _meta: SeshatObjectMeta): Promise<void> {
    throw new Error('read only bucket');
  },

  async delete(_path: string): Promise<void> {
    throw new Error('read only bucket');
  },

  async list(_prefix?: string): Promise<void> {
  },

};

export const uploadOnlyPolicy: SeshatBucketPolicy = {
  async get(_path: string): Promise<void> {
    throw new Error('upload only bucket');
  },

  async put(_path: string, _meta: SeshatObjectMeta): Promise<void> {
  },

  async delete(_path: string): Promise<void> {
    throw new Error('upload only bucket');
  },

  async list(_prefix?: string): Promise<void> {
    throw new Error('upload only bucket');
  },

};
