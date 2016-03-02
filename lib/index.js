'use strict';

var handlebars = require('handlebars')
  , SyntaxCheckingPass = require('./syntax')
  , translation = require('./translation')
  , version = require('../package.json').version;

function translateTemplate(mandrillTpl) {
  var src
    , ast
    , syntaxPass = new SyntaxCheckingPass()
    , sparkPostTpl
    , fragments = [];

  function collectFragments(s) { fragments.push(s); }

  // Parse
  try {
    src = translation.sourcePrep(mandrillTpl.code);
    ast = handlebars.parse(src);
  } catch (parseError) {
    throw {
      name: 'ParseError',
      message: parseError.message
    };
  }

  // Syntax check pass on the AST: collects untranslatable elements from the AST 
  try {
    syntaxPass.accept(ast);
  } catch (unexpectedError) {
    throw {
      name: 'Error',
      message: 'While checking template syntax: ' + unexpectedError,
      error: unexpectedError
    };
  }

  if (syntaxPass.infractions.length > 0) {
    throw {
      name: 'SyntaxError',
      message: 'Unsupported syntax found',
      errors: syntaxPass.infractions.map(function(issue) {
        return 'Unsupported syntax at line ' + issue.node.loc.start.line + ' col ' + issue.node.loc.start.line + ': ' + issue.msg;
      })
    };
  }

  // Translate
  // Note: this can throw {name: 'TranslationError', ...}
  new translation.TranslationPass(collectFragments).accept(ast);

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

function errorResponse(err, res) {
  switch (err.name) {
    case 'MandrillError':
      res.serverError('While extracting template from Mandrill: ' + err.message, err);
      return true;
    case 'ParseError':
      res.serverError('While parsing Mandrill template: ' + err.message);
      return true;
    case 'SyntaxError':
      res.serverErrorList(['While translating template: ' + err.message]
          .concat(err.errors));
      return true;
    case 'TranslationError':
      res.serverError('While translating template: ' + err.message);
      return true;
    case 'SparkPostError':
      res.serverErrorList(['Error while sending template to SparkPost']
        .concat(err.response.errors)); 
      return true;
    default:
      return false;
  }
  return false;
}

module.exports = {
  translateTemplate: translateTemplate,
  errorResponse: errorResponse
};

