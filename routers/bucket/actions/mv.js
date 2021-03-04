const path = require('path');

module.exports = {
  // Name of the action
  name: 'mv',
  // Finitio schema of the params
  paramsSchema: `
    old: String,
    new: String
  `,
  action: (params, dirent, storage) => {
    if (!params.new.match(/^[\w.-]+$/)) {
      throw new Error('Invalid chars in folder name');
    }
    if (['.', '..'].indexOf(params.new) >= 0) {
      throw new Error('Invalid folder name');
    }
    return storage.mv(path.join(dirent.name, params.old), path.join(dirent.name, params.new));
  }
};
