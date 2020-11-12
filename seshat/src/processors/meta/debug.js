import { inspect } from 'util';
import Promise from 'bluebird';

export default () => {
  return {
    process: (file) => {
      console.log('DEBUG:', inspect(file));
      return Promise.resolve(file);
    }
  };
};
