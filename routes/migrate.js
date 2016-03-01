'use strict';

var handlebars = require('handlebars')
  , TranslationPass = require('../lib/translation')
  , extractMandrillTemplate = require('../lib/mandrill')
  , storeSparkPostTemplate = require('../lib/sparkpost')
  , router = require('express').Router()
  , version = require('../package.json').version;

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

    var sparkPostTpl = translateTemplate(mandrillTpl);
    return storeSparkPostTemplate(req.body.sparkPostAPIKey, sparkPostTpl);

  }).then(function(storeResult) {

    return res.json({result: true});

  }).catch(function(err) {
    switch (err.name) {
      case 'MandrillError':
        return res.serverError('While extracting template from Mandrill: ' + err.message, err);
      case 'ParseError':
        return res.serverError('While parsing Mandrill template: ' + err.message);
      case 'TranslationError':
        return res.serverError('While translating template: ' + err.message);
      case 'SparkPostError':
        return res.serverErrorList(['Error while sending template to SparkPost']
          .concat(err.response.errors)); 
      default:
        res.serverError('Unexpected error: ' + err);
        throw err;
    }
  }).done();
});

function translateTemplate(mandrillTpl) {
  var ast
    , sparkPostTpl
    , fragments = [];

  function collectFragments(s) { fragments.push(s); }

  // Parse
  try {
    ast = handlebars.parse(mandrillTpl.code);
  } catch (parseError) {
    throw {
      name: 'ParseError',
      message: parseError.message
    };
  }

  // Translate
  // Note: this can throw {name: 'TranslationError', ...}
  new TranslationPass(collectFragments).accept(ast);

  // Format as SparkPost template structure
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

