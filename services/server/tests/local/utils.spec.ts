import fs, { Dirent } from 'fs';
import path from 'path';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
import { readdir } from '../../src/local/utils';
import { expect } from 'chai';

describe('fs utils', () => {

  describe('readdir', () => {

    let tmpdir: string;
    const tmpdirRelative: string = path.join(process.cwd(), 'tmp/seshat-tests');
    beforeEach(() => {
      tmpdir = fs.mkdtempSync('seshat-tests');
      fs.mkdirSync(tmpdirRelative);
    });

    afterEach(() => {
      fs.rmSync(tmpdir, { recursive: true });
      fs.rmSync(tmpdirRelative, { recursive: true });
    });

    const createTmpFile = (fname: string, folder: string) => {
      const objectname = path.join(folder, fname);
      const dirname = path.dirname(objectname);
      fs.mkdirSync(dirname, { recursive: true });
      fs.writeFileSync(objectname, 'this is a test file');
    };

    const objExists = (name: string, objects: Dirent[]) => {
      const object = objects.find(o => o.name === name);
      // eslint-disable-next-line no-unused-expressions
      expect(object).to.exist;
    };

    it('raises if the root path does not exist', async () => {
      return expect(readdir('/this/does/not/exist')).to.eventually.rejectedWith(/ENOENT/);
    });

    it('returns an empty array for empty folders', async () => {
      // For absolute paths
      let objects = await readdir(tmpdir);
      // eslint-disable-next-line no-unused-expressions
      expect(objects).to.be.empty;

      // For relative paths
      objects = await readdir(tmpdirRelative);
      // eslint-disable-next-line no-unused-expressions
      expect(objects).to.be.empty;
    });

    it('returns the correct list of objects', async () => {
      // Absolute paths
      createTmpFile('seshat.txt', tmpdir);
      let objects = await readdir(tmpdir);
      expect(objects).to.have.property('length', 1);
      objExists('seshat.txt', objects);

      // Relative paths
      createTmpFile('seshat.txt', tmpdirRelative);
      objects = await readdir(tmpdirRelative);
      expect(objects).to.have.property('length', 1);
      objExists('seshat.txt', objects);
    });

    it('returns the correct list of objects, including folders', async () => {
      // Absolute paths
      createTmpFile('seshat.txt', tmpdir);
      fs.mkdirSync(path.join(tmpdir, 'subfolder'));
      let objects = await readdir(tmpdir);
      expect(objects).to.have.property('length', 2);
      objExists('seshat.txt', objects);
      objExists('subfolder', objects);

      // Relative paths
      createTmpFile('seshat.txt', tmpdirRelative);
      fs.mkdirSync(path.join(tmpdirRelative, 'subfolder'));
      objects = await readdir(tmpdirRelative);
      expect(objects).to.have.property('length', 2);
      objExists('seshat.txt', objects);
      objExists('subfolder', objects);
    });

    it('does not work recursively by default', async () => {
      // Absolute paths
      createTmpFile('seshat.txt', tmpdir);
      createTmpFile('subfolder1/subfolder2/subfolder3/seshat.txt', tmpdir);
      let objects = await readdir(tmpdir);
      objects = objects.sort((a, b) => a.name < b.name ? -1 : 1);
      expect(objects).to.have.property('length', 2);

      objExists('seshat.txt', objects);
      objExists('subfolder1', objects);

      // Relative paths
      createTmpFile('seshat.txt', tmpdirRelative);
      createTmpFile('subfolder1/subfolder2/subfolder3/seshat.txt', tmpdirRelative);
      objects = await readdir(tmpdirRelative);
      objects = objects.sort((a, b) => a.name < b.name ? -1 : 1);
      expect(objects).to.have.property('length', 2);

      objExists('seshat.txt', objects);
      objExists('subfolder1', objects);
    });

    it('can work recursively', async () => {
      // Absolute paths
      createTmpFile('seshat.txt', tmpdir);
      createTmpFile('subfolder1/subfolder2/subfolder3/seshat.txt', tmpdir);
      let objects = await readdir(tmpdir, true);
      objects = objects.sort((a, b) => a.name < b.name ? -1 : 1);
      expect(objects).to.have.property('length', 5);

      objExists('seshat.txt', objects);
      objExists('subfolder1', objects);
      objExists('subfolder1/subfolder2', objects);
      objExists('subfolder1/subfolder2/subfolder3', objects);
      objExists('subfolder1/subfolder2/subfolder3/seshat.txt', objects);

      // Relative paths
      createTmpFile('seshat.txt', tmpdirRelative);
      createTmpFile('subfolder1/subfolder2/subfolder3/seshat.txt', tmpdirRelative);
      objects = await readdir(tmpdirRelative, true);
      objects = objects.sort((a, b) => a.name < b.name ? -1 : 1);
      expect(objects).to.have.property('length', 5);

      objExists('seshat.txt', objects);
      objExists('subfolder1', objects);
      objExists('subfolder1/subfolder2', objects);
      objExists('subfolder1/subfolder2/subfolder3', objects);
      objExists('subfolder1/subfolder2/subfolder3/seshat.txt', objects);
    });

  });

});
