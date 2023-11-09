import { BucketPolicy } from '../../src/types';
import { ObjectMeta } from '@enspirit/seshat-commons';

export const readOnlyPolicy: BucketPolicy = {

  async head(_path: string): Promise<void> {
  },

  async get(_path: string): Promise<void> {
  },

  async put(_meta: ObjectMeta): Promise<void> {
    throw new Error('read only bucket');
  },

  async delete(_path: string): Promise<void> {
    throw new Error('read only bucket');
  },

  async list(_prefix?: string): Promise<void> {
  },

  async mkdir(_prefix: string): Promise<void> {
    throw new Error('read only bucket');
  },

};

export const uploadOnlyPolicy: BucketPolicy = {
  async head(_path: string): Promise<void> {
    throw new Error('upload only bucket');
  },

  async get(_path: string): Promise<void> {
    throw new Error('upload only bucket');
  },

  async put(_meta: ObjectMeta): Promise<void> {
  },

  async delete(_path: string): Promise<void> {
    throw new Error('upload only bucket');
  },

  async list(_prefix?: string): Promise<void> {
    throw new Error('upload only bucket');
  },

  async mkdir(_prefix: string): Promise<void> {
  },

};
