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

  } catch (err) {
    if (!ctrl.errorResponse(err, res)) {
      res.serverError('Unexpected error: ' + err);
      throw err;
    }
  }

  // Response
  res.json({sparkPostTemplate: tpl.content.html});
});

module.exports = router;
