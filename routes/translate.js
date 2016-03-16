'use strict';

var ctrl = require('../lib')
, router = require('express').Router();

// Request: {mandrillTemplate: '...'}
// Error response: {errors: ['...', ...]}
// Success response: {sparkpostTemplate: '...'}
router.post('/', function(req, res) {
  var tpl;

  function collectFragments(s) {
    fragments.push(s);
  }

  // request: mandrillTemplate: string
  if (!req.body.hasOwnProperty('mandrillTemplate')) {
    res.clientError('Request must include a "mandrillTemplate" field containing template');
    return;
  }

  try {
   tpl = ctrl.translateTemplate({
     code: req.body.mandrillTemplate
   });

    // Response
    res.json({sparkPostTemplate: tpl.content.html});

  } catch (err) {
    if (!ctrl.errorResponse(err, res)) {
      err.message = 'Unexpected error: ' + err;
      res.serverError(err);
      throw err;
    }
  }
});

module.exports = router;
