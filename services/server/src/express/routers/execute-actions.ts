import express, { NextFunction, Request, Response, Router } from 'express';
import { json } from 'body-parser';
import { Bucket, Action } from '../../types';
import { UnknownActionError } from '@enspirit/seshat-commons';

export const SESHAT_ACTION_HEADER = 'application/vnd.seshat-action+json';

export const ExecuteActions = (actions: Action[] = []) => (bucket: Bucket): Router => {

  const router = express();
  router.use(json({ type: SESHAT_ACTION_HEADER }));

  const isSeshatActionRequest = (req: Request, _res: Response, next: NextFunction) => {
    // We only execute this router if the header is present,
    // otherwise we execute the next matching routes
    if (req.headers['content-type'] === SESHAT_ACTION_HEADER) {
      req.seshat.bucket ||= bucket;
      return next();
    }
    next('route');
  };

  /**
   * Execute actions
   */
  router.post('*', isSeshatActionRequest, async (req, res, next) => {
    const actionName = req.headers['seshat-action'] as String;
    // At least the action name must be defined
    if (!actionName) {
      return res.status(400).send({
        error: 'Missing \'action\' parameter',
      });
    }

    // look for the action
    const action = actions.find((a: Action) => a.name === actionName);
    if (!action) {
      return next(new UnknownActionError(`Unknown action: '${actionName}`));
    }

    try {
      const actionResult = await action.run(req, res, next);
      if (!res.headersSent) {
        return res.send(actionResult);
      }
    } catch (error: any) {
      next(error);
    }

  });

  return router;
};
