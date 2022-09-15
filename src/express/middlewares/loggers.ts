import { Request, Response, NextFunction } from 'express';
import { SeshatError } from '../../errors';

export const RequestLogger = (req: Request, res: Response, next: NextFunction) => {
  // Log requests once they finish (or fail)
  let finished = false;
  res.on('finish', () => {
    finished = true;
    req.seshat.logger.info(`${req.method} ${req.path} ${res.statusCode}`);
  });

  res.on('close', () => {
    if (!finished) {
      req.seshat.logger.warning(`${req.method} ${req.path} - connection closed abruptly`);
    }
  });

  next();
};

export const ErrorLogger = (err: Error, req: Request, res: Response, _next: NextFunction) => {
  req.seshat.logger.error({ error: err.constructor.name, message: err.message, request: { path: req.path, method: req.method } });
  if (err instanceof SeshatError) {
    res.status(err.httpCode).send({ error: err.message });
  } else {
    res.status(500).send({ error: err.message });
  }
};
