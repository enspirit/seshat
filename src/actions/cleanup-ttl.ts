import { Request } from 'express';
import { Action } from '../types';

export type CleanupTTLOptions = {
  ttlMetadataKey: string
}

const DefaultOptions: CleanupTTLOptions = {
  ttlMetadataKey: 'ttl',
};

export const CleanupTTL = (options: CleanupTTLOptions = DefaultOptions): Action => {
  return {
    name: 'cleanup-ttl',
    run: async (req: Request): Promise<any> => {

      const recursive = req.body?.recursive || false;

      const path = decodeURIComponent(req.path.substring(1));
      const bucket = req.seshat.bucket;

      const objects = await bucket.list(path, { recursive });
      const now = new Date();

      const toDelete = objects.filter(o => {
        if (!o[options.ttlMetadataKey] || !o.ctime) {
          return false;
        }
        const expirationDate = new Date(o.ctime.getTime() + (o[options.ttlMetadataKey] * 1000));
        return now.getTime() > expirationDate.getTime();
      });

      const promises = toDelete.map(o => bucket.delete(o.name));
      await Promise.all(promises);

      return {
        deleted: toDelete,
      } as any;
    },
  };
};
