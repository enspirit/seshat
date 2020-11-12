import logger from './logger';
import config from '../config';
import app from './app';

app.set('port', config.get('api.port'));

const server = app.listen(app.get('port'), () => {
  logger.info('Express server listening on port ' + server.address().port);
});
