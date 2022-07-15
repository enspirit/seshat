import express, { Router } from 'express';
import { json } from 'body-parser';
import { SeshatConfig, SeshatAction } from '../../types';
import { ObjectNotFoundError } from '../../errors';

export const SESHAT_ACTION_HEADER = 'application/vnd.seshat-action+json';

export const createRouter = (config: SeshatConfig): Router => {

  const { actions } = config;
  const router = express();
  router.use(json({ type: SESHAT_ACTION_HEADER }));

  const isSeshatActionRequest = (req, res, next) => {
    // We only execute this router if the header is present,
    // otherwise we execute the next matching routes
    if (req.headers['content-type'] === SESHAT_ACTION_HEADER) {
      return next();
    }
    next('route');
  };

  /**
   * Execute actions
   */
  router.post('*', isSeshatActionRequest, async (req, res) => {
    const actionName = req.headers['seshat-action'];
    // At least the action name must be defined
    if (!actionName) {
      return res.status(400).send({
        error: 'Missing \'action\' parameter',
      });
    }

    // look for the action
    const action = actions.find((a: SeshatAction) => a.name === actionName);
    if (!action) {
      return res.status(400).send({ error: `Unknown action: '${actionName}` });
    }

    try {
      const actionResult = await action.run(req);
      return res.send(actionResult);
    } catch (error) {
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).send({ error: error.message });
      }
      return res.status(500).send({ error: error.message });
    }

  });

  return router;
};
