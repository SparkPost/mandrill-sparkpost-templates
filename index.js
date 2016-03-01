'use strict';

var express = require('express')
  , bodyParser = require('body-parser')
  , app = express()
  , srv = require('http').Server(app)
  , translateRouter = require('./routes/translate')
  , migrateRouter = require('./routes/migrate');

// ----------------------------------------------------------------------------

app.use(express.static(__dirname + '/static'));
app.use('/bootstrap', express.static(__dirname + '/node_modules/bootstrap/dist'));

// ----------------------------------------------------------------------------

app.use(bodyParser.json({
  limit: '500kb'
}));

app.use(function(req, res, next) {
  function errorResponse(code, msg, err) {
    var errMsg = '';
    if (err) {
      errMsg = ': ' + (err.message || err);
    }
    res.status(code).send({errors:[msg + errMsg]});
  };

  function errorListResponse(code, errlist) {
    res.status(code).send({errors: errlist});
  }

  res.clientError = function(msg, err) { errorResponse(400, msg, err); };
  res.serverError = function(msg, err) { errorResponse(500, msg, err); };
  res.clientErrorList = function(errList) { errorListResponse(400, errList); };
  res.serverErrorList = function(errList) { errorListResponse(500, errList); };

  next();
});

app.use('/api/translate', translateRouter);
app.use('/api/migrate', migrateRouter);

srv.listen(process.env.POST || 3000, function() {
  console.log('Listening on ' + srv.address().port);
});

