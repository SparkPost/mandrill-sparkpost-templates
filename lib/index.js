'use strict';

var handlebars = require('handlebars')
  , parseOneAddress = require('email-addresses').parseOneAddress
  , SyntaxCheckingPass = require('./syntax')
  , translation = require('./translation')
  , version = require('../package.json').version;

String.prototype.replaceAll = function(search, replacement) {
  var target = this;
  return target.split(search).join(replacement);
}

function translateContent(content) {
  var src
    , ast
    , syntaxPass = new SyntaxCheckingPass()
    , sparkPostTpl
    , fragments = [];

  function collectFragments(s) { fragments.push(s); }

  // Parse
  try {
    src = translation.sourcePrep(content);
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
      name: 'UnexpectedError',
      message: 'While checking template syntax: ' + unexpectedError,
      error: unexpectedError
    };
  }

  if (syntaxPass.infractions.length > 0) {
    throw {
      name: 'SyntaxError',
      message: 'Unsupported syntax found: \n' + syntaxPass.infractions.map(function(issue) {
        return 'Line ' + issue.node.loc.start.line + ': ' + issue.msg;
      }).join('\n')
    };
  }

  // Translate
  // Note: this can throw {name: 'TranslationError', ...}
  try {
    new translation.TranslationPass(collectFragments).accept(ast);
  } catch(e) {
    throw {
      name: e.name,
      message: e.message
    };
  }

  return fragments.join('');
}

function translateTemplate(mandrillTpl, options) {
  var opts = options || {}
    , useSandboxDomain = opts.useSandboxDomain || false
    , sandboxDomain = process.env.SPARKPOST_SANDBOX_DOMAIN || 'sparkpostbox.com'
    , emailAddr = mandrillTpl.from_email
    , localPart = 'imported' // Default value
    , html
    , text;

  // Translate HTML and text parts
  if (mandrillTpl.code) {
    html = translateContent(mandrillTpl.code);
  }

  if (mandrillTpl.text) {
    text = translateContent(mandrillTpl.text);
  }

  if (useSandboxDomain) {
    if (emailAddr) {
      localPart = parseOneAddress(emailAddr).local;
    }
    emailAddr = localPart + '@' + sandboxDomain;
  }

  // Format as SparkPost template structure
  return {
    id: mandrillTpl.slug,
    content: {
      html: html,
      text: text,
      subject: mandrillTpl.subject,
      from: {
        name: mandrillTpl.from_name,
        email: emailAddr
      }
    },
    description: 'Translated by mandrill2sparkpost ' + version
  };
}

function errorResponse(err, res) {
  switch (err.name) {
    case 'MandrillError':
      err.message = 'While extracting template from Mandrill: ' + err.message;
      res.serverError(err);
      return true;
    case 'ParseError':
      err.message = 'While parsing Mandrill template: ' + err.message;
      res.serverError(err);
      return true;
    case 'SyntaxError':
      err.message = 'While translating template: ' + err.message;
      res.serverError(err);
      return true;
    case 'TranslationError':
      err.message = 'While translating template: ' + err.message;
      res.serverError(err);
      return true;
    case 'SparkPostError':
      var sperr = {
        name: 'SparkPostError',
        message: 'Error while sending template to SparkPost: ' +
          err.response.errors.map(function(e) {
            var desc = e.description ? ': ' + e.description : '';
            return e.message + desc; 
          })
      };
      res.serverError(sperr);
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
