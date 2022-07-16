import { Request, Response, NextFunction } from 'express';

export const SESHAT_CONTENT_TYPE = 'application/vns.seshat+json';

export default function seshatRequestMiddleware(config) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.headers.accept === SESHAT_CONTENT_TYPE) {
      req.isSeshatProtocol = true;
    }

    next();
  };
}
