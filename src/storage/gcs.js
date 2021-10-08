import { Storage } from '@google-cloud/storage';
import mime from 'mime-types';
import { ActionNotSupportedError } from '../robust/errors';
import GCSStats from './gcs/stats';
import AbstractStorage from './abstract';

const mimeLookup = (fname) => {
  return mime.lookup(fname) || null;
};

const createFakeDirent = (name, files = undefined) => {
  return {
    name,
    files,
    isFile() {
      return false;
    },
    isDirectory() {
      return true;
    },
  };
};

export default class GCSStorage extends AbstractStorage {

  #client;
  #bucket;
  constructor({ bucket, storageOptions }) {
    super();
    this.#client = new Storage(storageOptions);
    this.#bucket = this.#client.bucket(bucket);
  }

  dirent(path) {
    const prefix = this.#removePrefix(path);
    return this.#bucket.getFiles({
      prefix,
      autoPaginate: false,
      delimiter: '/',
    }).then(([files, _, apiResponse]) => {

      const prefixes = apiResponse.prefixes || [];
      const content = this.#toContentArray(prefix, files, apiResponse);

      if (content.length === 0) {
        const err = new Error('Not found');
        err.code = 'ENOENT';
        throw err;
      }

      if (content.length > 1) {
        return createFakeDirent(path, content);
      }

      if (prefixes.length > 0) {
        return createFakeDirent(path, content);
      }

      const entry = files[0];
      if (entry.name === prefix) {
        return GCSStats.factorFile(entry);
      }
      return createFakeDirent(path, content);
    }).catch((err) => {
      if (err.message === 'Not found') {
        err.code = 'ENOENT';
      }
      throw err;
    });
  }

  mkdir() {
    throw new ActionNotSupportedError('Folders are not supported by GCSStorage');
  }

  mv(/*oldpath, newpath*/) {
    throw new ActionNotSupportedError('Folders are not supported by GCSStorage');
  }

  save(filestream, filename) {
    const path = this.#removePrefix(filename);
    const blob = this.#bucket.file(path);
    return new Promise((resolve, reject) => {
      const stream = blob.createWriteStream({ resumable: false });
      stream.on('error', (err) => reject(err));
      stream.on('finish', () => resolve(path));
      filestream.pipe(stream);
    });
  }

  list(path) {
    return this.dirent(path).then((dirent) => {
      if (!dirent.isDirectory()) {
        throw new Error('Can\'t list a file');
      }
      return dirent.files;
    });
  }

  get(filename) {
    const path = this.#removePrefix(filename);
    return Promise.resolve(this.#bucket.file(path).createReadStream());
  }

  #removePrefix(str, prefix = '/') {
    if (!str) {
      return '';
    }
    if (str.indexOf(prefix) === 0) {
      return str.substring(prefix.length);
    }
    return str;
  }

  #removeSuffix(path, suffix = '/') {
    if (path[path.length - 1] === suffix) {
      return path.substring(0, path.length - 1);
    }
    return path;
  }

  #toContentArray(prefix, files, apiResponse) {
    return files
      .map((f) => {
        return {
          name: this.#removePrefix(f.name, prefix),
          isDirectory: false,
          type: mimeLookup(f.name),
        };
      })
      .concat((apiResponse.prefixes || []).map((d) => {
        return {
          name: this.#removeSuffix(this.#removePrefix(d, prefix)),
          isDirectory: true,
          type: 'directory',
        };
      }));
  }

}
