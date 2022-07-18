import { Request, Response, NextFunction } from 'express';
import path = require('path');
import { SeshatConfig, SeshatRequest } from '../types';

export const SESHAT_CONTENT_TYPE = 'application/vns.seshat+json';

export default function seshatRequestMiddleware(_config: SeshatConfig) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.headers.accept === SESHAT_CONTENT_TYPE) {
      req.isSeshatProtocol = true;
    }

    req.seshat = {
      filename: path.basename(req.path),
      path: req.path,
      bucket: _config.bucket,
    };

    next();
  };
}
