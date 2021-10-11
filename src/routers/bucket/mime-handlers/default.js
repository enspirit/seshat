import ContentType from 'content-type';
import mime from 'mime-types';

export default (req, res, next) => {
  // TODO: find better logic than this, we should
  // detect that no other middleware have processed the body
  const contentType = req.headers['content-type'] || '';
  if (contentType.indexOf('multipart/form-data') >= 0) {
    return next();
  }

  const disposition = req.headers['content-disposition'];
  let filename;
  if (disposition && disposition.indexOf('attachment') !== -1) {
    const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
    const matches = filenameRegex.exec(disposition);
    if (matches && matches[1]) {
      filename = matches[1].replace(/['"]/g, '');
    }
  }

  let mimetype, charset;
  if (contentType) {
    const parsed = ContentType.parse(contentType);
    mimetype = parsed.type;
    charset = parsed.parameters.charset;
  }

  if (!filename) {
    const extension = mimetype ?
      mime.extension(mimetype) : 'bin';
    filename = `upload.${extension}`;
  }

  const p = req.pipeline.process({
    filename: filename,
    path: req.path,
    mimetype: mimetype,
    charset: charset,
    stream: req,
  }, req.query);

  p.then(() => next());
};
