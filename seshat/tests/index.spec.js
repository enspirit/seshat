import Index from '../src/index';
import { expect } from 'chai';

describe('Index', () => {

  it('exports a class', () => {
    expect(Index).to.be.a.instanceof(Function);
  });

  it('its constructors works', () => {
    expect(new Index()).to.be.an.instanceof(Index);
  });

  it('its getter works', () => {
    const idx = new Index();
    expect(idx.name).to.equal('skeleton');
  });

  it('its method works', () => {
    const idx = new Index();
    expect(idx.test()).to.deep.equal([1, 2, 3]);
  });

});
