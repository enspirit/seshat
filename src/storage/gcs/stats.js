import fs from 'fs';

export default class GCSStats extends fs.Stats {
  isFile() {
    return true;
  }

  static factorFile(file) {
    const mtime = new Date(file.metadata.updated);
    const ctime = new Date(file.metadata.timeCreated);
    return new GCSStats(
      // dev
      undefined,
      // mode
      undefined,
      // nlink
      undefined,
      // uid
      undefined,
      // gid
      undefined,
      // rdev
      undefined,
      // blksize
      undefined,
      // ino
      undefined,
      // size
      file.metadata.size,
      // blocks
      undefined,
      // atimeMs
      undefined,
      // mtimeMs
      mtime.getTime(),
      // ctimeMs
      ctime.getTime(),
      // birthtimeMs
      ctime.getTime(),
      // atime
      undefined,
      // mtime
      mtime.toGMTString(),
      // ctime
      ctime.toGMTString(),
      // birthtime
      ctime.toGMTString(),
    );
  }
}
