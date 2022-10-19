import { NextFunction, Request, Response } from 'express';
import { Action, ObjectMeta } from '../types';
import JSZip from 'jszip';

export const DownloadArchiveAction: Action = {
  name: 'download-archive',
  run: async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
      const path = decodeURIComponent(req.path.substring(1));
      const bucket = req.seshat.bucket;

      const metas = await bucket.list(path, { recursive: true });
      const zip = new JSZip();
      const promises = metas.map(async (m: ObjectMeta) => {
        const object = await bucket.get(m.name);
        zip.file(object.meta.name, object.body);
      });

      await Promise.all(promises);
      const stream = zip.generateNodeStream({ streamFiles: true });

      return new Promise((resolve, reject) => {
        res.header('Content-Type', 'application/zip');
        stream
          .pipe(res)
          .on('error', (err) => {
            reject(err);
          })
          .on('finish', () => {
            resolve(null);
          });
      });
    } catch (err) {
      next(err);
    }
  },
};
