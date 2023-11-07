import path from 'path';
import fs from 'fs/promises';
import { Dirent } from 'fs';

const hackDirent = (dirent: Dirent, parent?: string): Dirent => {
  dirent.name = parent ? path.join(parent, dirent.name) : dirent.name;
  return dirent;
};

export const readdir = (root: string, recursive?: boolean, parent?: string): Promise<Dirent[]> => {
  const dirname = parent ? path.join(root, parent) : root;
  return fs
    .readdir(dirname, { withFileTypes: true })
    .then(dirents => {
      const directoryPaths = recursive ? dirents.filter(a => a.isDirectory()) : [];
      const filePaths = dirents;

      return Promise.all([
        ...directoryPaths.map(a => {
          const newParent = parent ? path.join(parent, a.name) : a.name;
          return readdir(root, recursive, newParent);
        }).flat(),
        ...filePaths.map(a => Promise.resolve(hackDirent(a, parent))),
      ]).then(a => a.flat());
    });
};

