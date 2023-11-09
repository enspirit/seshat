import { Request, Response, NextFunction } from 'express';
import { SeshatError } from '@enspirit/seshat-commons';

// Log requests once they finish (or fail)
export const RequestLogger = (req: Request, res: Response, next: NextFunction) => {
  let finished = false;
  const start = Date.now();
  const elapsed = () => `${Date.now() - start}ms`;

  res.on('finish', () => {
    finished = true;
    req.seshat.logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} ${elapsed()}`);
  });

  res.on('close', () => {
    if (!finished) {
      req.seshat.logger.warn(`${req.method} ${req.originalUrl} - ${elapsed()} - connection closed abruptly`);
    }
  });

  next();
};

export const ErrorLogger = (err: Error, req: Request, res: Response, _next: NextFunction) => {
  const log: any = {
    error: err.constructor.name,
    message: err.message,
    stack: err.stack,
    request: {
      path: req.path,
      method: req.method,
    },
  };

  req.seshat.logger.error(log);

  if (err instanceof SeshatError) {
    res.status(err.httpCode).send({ code: err.constructor.name, message: err.message });
  } else {
    res.status(500).send({ code: 'UnexpectedErrorr', message: err.message });
  }
};
