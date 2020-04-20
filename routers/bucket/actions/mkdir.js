const path = require('path');

module.exports = {
  // Name of the action
  name: 'mkdir',
  // Finitio schema of the params
  paramsSchema: `
    name: String
  `,
  action: (params, dirent, storage) => {
    if (!params.name.match(/^[\w.-]+$/)) {
      throw new Error('Invalid chars in folder name');
    }
    if (['.', '..'].indexOf(params.name) >= 0) {
      throw new Error('Invalid filename');
    }
    return storage.mkdir(path.join(dirent.name, params.name));
  }
};
