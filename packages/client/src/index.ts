export * from '@enspirit/seshat-commons';
import { ObjectMeta } from '@enspirit/seshat-commons';
import type { ListOptions, Object } from './types';
import axios, { AxiosBasicCredentials, AxiosInstance, AxiosRequestHeaders } from 'axios';

export type ClientOptions = {
  baseURL?: string;
  headers?: AxiosRequestHeaders;
  timeout?: number;
  auth?: AxiosBasicCredentials;
}

export default class Client {

  protected axios: AxiosInstance;

  constructor(protected options?: ClientOptions) {
    this.axios = axios.create(options);
  }

  async exists(name: string): Promise<boolean> {
    await this.axios.head(name);
    return true;
  };

  async get(name: string): Promise<Object> {
    const res = await this.axios.get(name);
    return res.data;
  }

  async put(object: Buffer, meta: ObjectMeta): Promise<ObjectMeta> {
    const res = await this.axios.put(meta.name, object);
    return res.data;
  }

  async delete(name: string): Promise<void> {
    console.log('deleteing yeah')
    const res = await this.axios.delete(name);
    return res.data;
  }

  async list(prefix?: string, options?: ListOptions): Promise<ObjectMeta[]> {
    const res = await this.axios.get(prefix || '/', {
      params: options
    });
    return res.data;
  }

  async mkdir(_prefix: string): Promise<void> {
    throw new Error('mkdir not implemented yet');
  }

}

