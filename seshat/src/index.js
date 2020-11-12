import config from '../config';
import app from './app';

app.set('port', config.get('api.port'));

const server = app.listen(app.get('port'), () => {
  console.log('Express server listening on port ' + server.address().port);
});
