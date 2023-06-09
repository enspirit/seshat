import { Request, Response } from 'express';
import { Action } from '../types';
import JSZip from 'jszip';
import { SeshatError } from '../errors';

export type ObjectSelection = {
  [key: string]: Array<string>
}

export type ArchiveOptions = {
  objects?: Array<string> | ObjectSelection
  useOriginalNames?: boolean
}

export class ArchiveActionError extends SeshatError {
  httpCode = 400;
}

export type ObjectToExport = {
  name: string,
  folder?: string
}

const isValidArrayOfString = (a: Array<unknown>) => (Array.isArray(a) && a.every(o => typeof o === 'string'));

const DefaultOptions: ArchiveOptions = {
  useOriginalNames: false,
};

export const DownloadArchiveAction: Action = {
  name: 'download-archive',
  run: async (req: Request, res: Response): Promise<any> => {

    const options: ArchiveOptions = Object.assign({}, DefaultOptions, req.body);
    const bucket = req.seshat.bucket;

    if (options.objects) {
      const valid =
        // Make sure the objects option is either an array of string
        isValidArrayOfString(options.objects as Array<unknown>)
        // or a collection of objectselection
        || (Object.values(options.objects).every(isValidArrayOfString));
      if (!valid) {
        throw new ArchiveActionError('objects option must be either a an array of object names or an object selection');
      }
    }

    let objectsToExport: Array<ObjectToExport>;
    if (Array.isArray(options.objects)) {
      objectsToExport = req.body.objects.map((name: string) => ({ name }));
    } else if (options.objects) {
      objectsToExport = Object.entries(options.objects)
        .reduce((objects, [folder, names]) => {
          const content: Array<ObjectToExport> = names.map(name => ({ name, folder }));
          return objects.concat(content);
        }, [] as Array<ObjectToExport>);
    } else {
      const path = decodeURIComponent(req.path.substring(1));
      const metas = await bucket.list(path, { recursive: true });
      objectsToExport = metas.map(m => ({ name: m.name }));
    }

    const zip = new JSZip();
    const promises = objectsToExport.map(async (toExport) => {
      const object = await bucket.get(toExport.name);
      const name = options.useOriginalNames ? object.meta.originalname || object.meta.name : object.meta.name;

      if (toExport.folder) {
        zip.folder(toExport.folder)?.file(name, object.body);
      } else {
        zip.file(name, object.body);
      }
    });

    await Promise.all(promises);
    const stream = zip.generateNodeStream({ streamFiles: true });

    return new Promise((resolve, reject) => {
      res.header('Content-Type', 'application/zip');
      stream
        .pipe(res)
        .on('error', (err: any) => {
          reject(err);
        })
        .on('finish', () => {
          resolve(null);
        });
    });
  },
};
