'use strict';

var express = require('express')
  , bodyParser = require('body-parser')
  , app = express()
  , srv = require('http').Server(app)
  , translateRouter = require('./routes/translate')
  , migrateRouter = require('./routes/migrate')
  , sandboxDomainRouter = require('./routes/sandboxDomain');

// ----------------------------------------------------------------------------

app.use(express.static(__dirname + '/static'));
app.use('/vendor', express.static(__dirname + '/vendor/client'));

// ----------------------------------------------------------------------------

app.use(bodyParser.json({
  limit: '2mb'
}));

app.use(function(req, res, next) {
  function conditionError(err) {
    var keylist = ['name', 'message', 'description', 'code', 'row', 'col']
      , ret = {};
    Object.keys(err).forEach(function(k) {
      if (keylist.indexOf(k) >= 0) {
        ret[k] = err[k];
      }
    });
    return ret;
  }

  function errorResponse(code, errlist) {
    res.status(code).send({
      errors: errlist.map(conditionError)
    });
  }

  res.clientError = function(err) { errorResponse(400, [{message: err}]); };
  res.serverError = function(err) { errorResponse(500, [err]); };
  res.clientErrorList = function(errList) { errorResponse(400, errList); };
  res.serverErrorList = function(errList) { errorResponse(500, errList); };

  next();
});

app.use('/api/translate', translateRouter);
app.use('/api/migrate', migrateRouter);
app.use('/api/sandboxDomain', sandboxDomainRouter);

srv.listen(process.env.PORT || 3000, function() {
  console.log('Listening on ' + srv.address().port);
});

