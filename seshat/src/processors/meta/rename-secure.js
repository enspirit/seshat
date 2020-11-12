import Promise from 'bluebird';
import crypto from 'crypto';
import mime from 'mime-types';

const randomBytes = Promise.promisify(crypto.randomBytes);

/**
  * This processor generates secure random filenames
  */
export default (length = 16) => {
  return {
    process: (file) => {
      return randomBytes(length)
        .then((buf) => {
          const unique = buf
            .toString('base64')
            .replace(/\//g, '_')
            .replace(/\+/g, '-');

          const extension = file.mimetype ?
            mime.extension(file.mimetype) : 'bin';

          file.originalFilename = file.filename;
          file.filename = `${unique}.${extension}`;

          return Promise.resolve(file);
        });
    }
  };
};

