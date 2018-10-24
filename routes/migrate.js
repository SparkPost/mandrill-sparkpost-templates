'use strict';

var ctrl = require('../lib')
  , extractMandrillTemplate = require('../lib/mandrill')
  , storeSparkPostTemplate = require('../lib/sparkpost')
  , router = require('express').Router()
  , appendUUID = false;

// Request: {mandrillTemplateName: '...', mandrillAPIKey: '...'}
// Error: {errors: ['...', ...]
// Response: {result: true}
router.post('/', function(req, res) {
  var spAPIKey
    , useSandboxDomain = false;

  // Validation
  if (!req.body.hasOwnProperty('mandrillTemplateName')) {
    return res.clientError('Expected mandrillTemplateName field');
  }

  if (!req.body.hasOwnProperty('mandrillAPIKey')) {
    return res.clientError('Expected mandrillAPIKey field');
  }

  if (!req.body.hasOwnProperty('sparkPostAPIKey')) {
    return res.clientError('Expected sparkPostAPIKey field');
  } else {
    spAPIKey = req.body.sparkPostAPIKey;
  }

  if (req.body.hasOwnProperty('useSandboxDomain')) {
    useSandboxDomain = req.body.useSandboxDomain;
  }

  extractMandrillTemplate(req.body.mandrillAPIKey, req.body.mandrillTemplateName)
  .then(function(mandrillTpl) {

    var sparkPostTpl = ctrl.translateTemplate(mandrillTpl, {useSandboxDomain: useSandboxDomain});
    if (appendUUID) {
      sparkPostTpl.id += require('uuid').v4();
    }
    return storeSparkPostTemplate(spAPIKey, sparkPostTpl);

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
