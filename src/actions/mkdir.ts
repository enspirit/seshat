import { Request } from 'express';
import { Action } from '../types';

export const MkdirActionFactory = (): Action => {
  return {
    name: 'mkdir',
    run: async (req: Request): Promise<any> => {

      const path = decodeURIComponent(req.path.substring(1));
      const bucket = req.seshat.bucket;

      await bucket.mkdir(path);

      return 'ok' as any;
    },
  };
};

/**
 * For backward compatibility when actions did not have parameters
 */
export const MkdirAction = MkdirActionFactory();
