import { expect } from 'chai';
import { deepMerge } from '../../src/utils';

describe('deepMerge', () => {

  const DefaultConfig = {
    downloadAs: {
      enabled: true,
      queryParam: 'download',
    },
    headers: {
      lastModified: true,
      etag: true,
      cacheControl: 'private, max-age=86400, must-revalidate',
    },
  };

  it('should return default config if no user config is provided', () => {
    const result = deepMerge(DefaultConfig, undefined);
    expect(result).to.deep.equal(DefaultConfig);
  });

  it('should override top-level properties', () => {
    const userConfig = {
      headers: {
        cacheControl: 'public, max-age=3600',
      },
    };
    const expected = {
      downloadAs: {
        enabled: true,
        queryParam: 'download',
      },
      headers: {
        lastModified: true,
        etag: true,
        cacheControl: 'public, max-age=3600',
      },
    };
    const result = deepMerge(DefaultConfig, userConfig);
    expect(result).to.deep.equal(expected);
  });

  it('should override nested properties without affecting others', () => {
    const userConfig = {
      downloadAs: {
        enabled: false,
      },
    };
    const expected = {
      downloadAs: {
        enabled: false,
        queryParam: 'download', // untouched
      },
      headers: {
        lastModified: true,
        etag: true,
        cacheControl: 'private, max-age=86400, must-revalidate',
      },
    };
    const result = deepMerge(DefaultConfig, userConfig);
    expect(result).to.deep.equal(expected);
  });

  it('should override multiple nested properties', () => {
    const userConfig = {
      downloadAs: {
        queryParam: 'dl',
      },
      headers: {
        etag: false,
      },
    };
    const expected = {
      downloadAs: {
        enabled: true,
        queryParam: 'dl',
      },
      headers: {
        lastModified: true,
        etag: false,
        cacheControl: 'private, max-age=86400, must-revalidate',
      },
    };
    const result = deepMerge(DefaultConfig, userConfig);
    expect(result).to.deep.equal(expected);
  });
});
