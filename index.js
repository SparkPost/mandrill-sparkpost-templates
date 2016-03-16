'use strict';

var startServer = require('./server').startServer;

startServer(function(srv, app) {
  console.log('Listening on ' + srv.address().port);
});

