import _ from 'lodash';
import express from 'express';
import mkdir from './mkdir';
import Finitio from 'finitio';
import bodyParser from 'body-parser';
import logger from '../../../logger';

const SESHAT_CONTENT_TYPE = 'application/vnd.seshat-action+json';

const typeName = (word) => {
  return word[0].toUpperCase() + word.substr(1) + 'Action';
};

export default ({ actions, storage }) => {
  const ActionSchemas = actions.map((a) => {
    return `
      ${typeName(a.name)} = {
        action : String(s | s === "${a.name}")
        params : {
          ${a.paramsSchema}
        }
      }
    `;
  }).join('\n');

  const schema = `
    @import finitio/data
    ${ActionSchemas}
    ${actions.map((a) => typeName(a.name)).join('|')}
  `;
  const system = Finitio.system(schema);

  const router = express.Router();

  router.post(/^(.*)$/, bodyParser.json({ type: SESHAT_CONTENT_TYPE }), (req, res, next) => {
    if (req.header('Content-Type') != SESHAT_CONTENT_TYPE) {
      return next();
    }
    if (!req.dirent) {
      return res.status(404).send('Not found');
    }
    // If we are not on a directoy, we do not accept actions
    // Todo, accept a scope per action (directoy/file)
    // So that "mkdir" can only be used on directory
    // while rename (say) could be used on files/directories
    if (!req.dirent.isDirectory()) {
      return res.status(422).send('Actions on files are not supported.');
    }
    try {
      system.dress(req.body);
    } catch (e) {
      logger.error(e);
      return res.status(422).send('Invalid action or parameters');
    }

    const action = _.find(actions, { name: req.body.action });
    if (!action) {
      return res.status(422).send('Unknown action');
    }

    action.action(req.body.params, req.dirent, storage)
      .then(() => {
        res.send(204);
      })
      .catch((err) => {
        res.send(err.message);
      });
  });

  return router;
};

const DEFAULTS = [mkdir];

export {
  mkdir,
  DEFAULTS
};

