import { Express, NextFunction, Request, Response } from 'express';
import { createApp, S3Bucket } from '../src';
import { s3client } from './s3';

/**
 * This simple example shows how you can setup a middleware to
 * ensure that requests come from a valid authenticated user.
 *
 * If you're familiar with expressjs you'll realize there is nothing
 * Seshat-specific here... it's just an expressjs middleware executed
 * before the Seshat router.
 */
export default (expressApp: Express, _seshatRootDir: string) => {

  const ensureAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (req.headers?.authorization !== 'Bearer a-very-special-secret') {
      return res.sendStatus(401);
    }
    next();
  };

  expressApp.use('/authentication', ensureAuthenticated, createApp({
    bucket: new S3Bucket({ s3client, bucket: 'my-s3-bucket', transformers: [] }),
  }));

};
