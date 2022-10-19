import { expect, default as chai } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
chai.use(sinonChai);

describe('GCSBucket', () => {

  describe('#list()', () => {

    it.skip('uses delimiters by default, to simulate a filesystem', () => {

    });

  });

});
