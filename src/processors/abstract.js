import { NotImplementedError } from '../robust/errors';

export default class AbstractProcessor {

  process(/*file*/) {
    throw new NotImplementedError('AbstractProcessor#process not implemented');
  }

}
