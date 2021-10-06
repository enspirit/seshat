import Promise from 'bluebird';
import Busboy from 'busboy';
import logger from '../../../logger';

export default (req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.indexOf('multipart/form-data') < 0) {
    return next();
  }

  const busboy = new Busboy({ headers: req.headers });

  const promises = [];

  busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
    logger.info(`File [${fieldname}]: filename: ${filename}, encoding: ${encoding}, mimetype: ${mimetype}`);
    const p = req.pipeline.process({
      filename: filename,
      path: req.path,
      encoding: encoding,
      mimetype: mimetype,
      stream: file,
    }, req.query);
    promises.push(p);
  });

  busboy.on('finish', () => {
    Promise.all(promises)
      .then(() => next())
      .catch((err) => {
        logger.error('Error in the pipeline', err);
        next(err);
      });
  });

  req.pipe(busboy);
};
