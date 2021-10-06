import logger from '../../logger';
import { inspect } from 'util';
import Promise from 'bluebird';

export default () => {
  return {
    process: (file) => {
      logger.info('DEBUG:', inspect(file));
      return Promise.resolve(file);
    },
  };
};
