'use strict';

var handlebars = require('handlebars')
  , TranslationPass = require('../lib/translation')
  , extractMandrillTemplate = require('../lib/mandrill')
  , router = require('express').Router()
  , version = require('../package.json').version;

// Request: {mandrillTemplateName: '...', mandrillAPIKey: '...'}
// Error: {errors: ['...', ...]
// Response: {sparkPostTemplate: '...'}
router.post('/', function(req, res) {
  // Validation
  if (!req.body.hasOwnProperty('mandrillTemplateName')) {
    return res.clientError('Expected mandrillTemplateName field');
  }

  if (!req.body.hasOwnProperty('mandrillAPIKey')) {
    return res.clientError('Expected mandrillAPIKey field');
  }

  // Pull Mandrill template
  extractMandrillTemplate(req.body.mandrillAPIKey, req.body.mandrillTemplateName)
  .then(function(mandrillTpl) {
    var ast
      , sparkPostTpl;

    // Parse
    try {
      ast = handlebars.parse(mandrillTpl.code);
    } catch (parseError) {
      return res.serverError('While parsing Mandrill template: ' + parseError);
    }

    // Translate
    try {
      sparkPostTpl = translateTemplate(ast, mandrillTpl);
    } catch(translationError) {
      return res.serverError('While translating template: ' + translationError);
    }

    // Response
    return res.json(sparkPostTpl);

  }).fail(function(err) {
    return res.serverError('While extracting template from Mandrill: ' + err.message, err);
  });
});

function translateTemplate(ast, mandrillTpl) {
  var fragments = [];

  function collectFragments(s) { fragments.push(s); }

  new TranslationPass(collectFragments).accept(ast);

  return {
    id: mandrillTpl.slug,
    content: {
      html: fragments.join(''),
      text: mandrillTpl.text,
      subject: mandrillTpl.subject,
      from: {
        name: mandrillTpl.from_name,
        email: mandrillTpl.from_email
      }
    },
    description: 'Translated by mandrill2sparkpost ' + version
  };
}

module.exports = router;

