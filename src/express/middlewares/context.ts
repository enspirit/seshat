import { NextFunction, Request, Response } from 'express';
import type { Config } from '../../types.js';
import defaultLogger from '../../logger.js';
import { randomUUID } from 'crypto';

export const ExposeContext = (config: Config) => (req: Request, res: Response, next: NextFunction) => {
  req.seshat = {
    bucket: config.bucket,
    logger: (config.logger || defaultLogger).child({ reqId: randomUUID() }),
  };
  next();
};
