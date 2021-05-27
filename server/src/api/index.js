const path = require('path');
const useDebug = require('debug');
const express = require('express');
const http = require('http');
const { json } = require('body-parser');
const cors = require('cors');
const config = require('../util/config');

const postRoutes = require('./post');
const topicRoutes = require('./topic');
const proxyRoutes = require('./proxy');

const debug = useDebug('api');
const app = express();

// Default error handler
function handleError(err, req, res, next) {
  if (err) {
    debug(`${err}`);
    res.status(500).send();
  } else {
    next(err);
  }
}

app.use(cors());

// Register body-parser middleware
app.use(json({ extended: true }));

// Register routes
const apiRoutes = express.Router();
apiRoutes.use('/post', postRoutes);
apiRoutes.use('/topic', topicRoutes);
apiRoutes.use('/proxy', proxyRoutes);
app.use('/api', apiRoutes);

// Mount the frontend app
if (process.env.NODE_ENV === 'production') {
  const build = [__dirname, '..', '..', '..', 'client', 'build'];
  app.use(express.static(path.join(...build)));
  app.get('/', (_, res) => {
    res.sendFile(path.join(...build, 'index.html'));
  });
}

// Swallow errors
app.use(handleError);

const server = http.createServer(app);

// This function wraps the standard HTTP lib with
// a Promise so that it can be used in an async func
module.exports = () => new Promise((resolve, reject) => {
  server.on('error', (err) => {
    debug('API module failed to start. ↓');
    debug(` > ${err}`);
    reject(err);
  });

  debug('Starting the API module...');
  server.listen(config.api.port, () => {
    debug(`API module started, listening on port ${config.api.port}.`);
    resolve();
  });
});
