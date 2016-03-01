'use strict';

var handlebars = require('handlebars')
  , SyntaxCheckingPass = require('../lib/syntax')
  , TranslationPass = require('../lib/translation')
  , router = require('express').Router()
  , checkSyntax = false;

// Request: {mandrillTemplate: '...'}
// Error response: {errors: ['...', ...]}
// Success response: {sparkpostTemplate: '...'}
router.post('/', function(req, res) {
  var ast
    , fragments = []
    , syntaxPass = new SyntaxCheckingPass();

  function collectFragments(s) {
    fragments.push(s);
  }

  // request: mandrillTemplate: string
  if (!req.body.hasOwnProperty('mandrillTemplate')) {
    res.clientError('Request must include a "mandrillTemplate" field containing template');
    return;
  }

  // Parse into AST
  try {
    ast = handlebars.parse(req.body.mandrillTemplate);
  } catch (parseError) {
    res.clientError(new Error('Failed to parse Mandrill template: ', parseError));
    return;
  }

  // Syntax check pass on the AST: collects untranslatable elements from the AST 
  if (checkSyntax) {
    try {
      syntaxPass.accept(ast);
    } catch (unexpectedError) {
      res.serverError(new Error('While checking template syntax: ', unexpectedError));
      return;
    }

    if (syntaxPass.infractions.length > 0) {
      res.clientErrorList(
        syntaxPass.infractions.map(function(issue) {
          return 'Unsupported syntax at line ' + issue.loc.start.line + ' col ' + issue.loc.start.line + '): ' + issue.type;
        })
      );
      return;
    }
  }

  // Translation pass: produce SparkPost template content from the AST
  try {
    new TranslationPass(collectFragments).accept(ast);
  } catch(translationError) {
    res.serverError(new Error('While translating: ', translationError));
    return;
  }

  // Response
  res.json({sparkPostTemplate: fragments.join('')});
});

module.exports = router;
