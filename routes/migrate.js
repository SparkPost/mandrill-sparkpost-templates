'use strict';

var ctrl = require('../lib')
  , extractMandrillTemplate = require('../lib/mandrill')
  , storeSparkPostTemplate = require('../lib/sparkpost')
  , router = require('express').Router();

// Request: {mandrillTemplateName: '...', mandrillAPIKey: '...'}
// Error: {errors: ['...', ...]
// Response: {result: true}
router.post('/', function(req, res) {
  // Validation
  if (!req.body.hasOwnProperty('mandrillTemplateName')) {
    return res.clientError('Expected mandrillTemplateName field');
  }

  if (!req.body.hasOwnProperty('mandrillAPIKey')) {
    return res.clientError('Expected mandrillAPIKey field');
  }

  if (!req.body.hasOwnProperty('sparkPostAPIKey')) {
    return res.clientError('Expected sparkPostAPIKey field');
  }

  extractMandrillTemplate(req.body.mandrillAPIKey, req.body.mandrillTemplateName)
  .then(function(mandrillTpl) {

    var sparkPostTpl = ctrl.translateTemplate(mandrillTpl);
    sparkPostTpl.id += require('uuid').v4();
    return storeSparkPostTemplate(req.body.sparkPostAPIKey, sparkPostTpl);

  }).then(function(storeResult) {

    return res.json({result: true});

  }).catch(function(err) {
    if (!ctrl.errorResponse(err, res)) {
      err.message = 'Unexpected error: ' + err.message;
      res.serverError(err);
      throw err;
    }
  }).done();
});

module.exports = router;

