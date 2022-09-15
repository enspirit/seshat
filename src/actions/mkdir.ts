import { Request } from 'express';
import { Action } from '../types';

export const mkdir: Action = {
  name: 'mkdir',
  run: async (req: Request): Promise<any> => {

    const path = req.path.substring(1);
    const bucket = req.seshat.bucket;

    await bucket.mkdir(path);

    return 'ok' as any;
  },
};
