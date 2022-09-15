import { NextFunction, Request, Response } from 'express';
import { Config } from '../../types';
import defaultLogger from '../../logger';

export const ExposeContext = (config: Config) => (req: Request, res: Response, next: NextFunction) => {
  req.seshat = {
    bucket: config.bucket,
    logger: config.logger || defaultLogger,
  };
  next();
};
