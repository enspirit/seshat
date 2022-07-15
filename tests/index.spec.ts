import { expect } from 'chai';
import { App } from '../src';

describe('App', () => {
  it('is a class', () => {
    expect(App).to.be.an.instanceof(Function);
  });
});
