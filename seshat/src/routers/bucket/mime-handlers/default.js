import ContentType from 'content-type';
import mime from 'mime';

export default (req, res, next) => {
  // TODO: find better logic than this, we should
  // detect that no other middleware have processed the body
  let contentType = req.headers['content-type'] || '';
  if (contentType.indexOf('multipart/form-data') >= 0){
    return next();
  }

  let disposition = req.headers['content-disposition'];
  let filename;
  if (disposition && disposition.indexOf('attachment') !== -1) {
    var filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
    var matches = filenameRegex.exec(disposition);
    if (matches && matches[1]) {
      filename = matches[1].replace(/['"]/g, '');
    }
  }

  let mimetype, charset;
  if (contentType) {
    let parsed = ContentType.parse(contentType);
    mimetype = parsed.type;
    charset = parsed.parameters.charset;
  }

  if (!filename){
    let extension = mimetype ?
      mime.extension(mimetype) : 'bin';
    filename = `upload.${extension}`;
  }

  let p = req.pipeline.process({
    filename: filename,
    path: req.path,
    mimetype: mimetype,
    charset: charset,
    stream: req
  }, req.query);

  p.then(() => next());
};
