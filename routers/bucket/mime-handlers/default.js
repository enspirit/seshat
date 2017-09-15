'use strict';

const mime = require('mime-types');

module.exports =  (storage) => (req, res, next) => {
  if (req.files && req.files.length){
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

  if (!filename){
    filename = 'frombody.' + mime.extension(req.headers['content-type']);
  }

  storage.save(req, filename)
  .then(() => {
    req.files = [filename];
    next();
  });
};