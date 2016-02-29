var handlebars = require('handlebars')
  , fs = require('fs')
  , ast = handlebars.parse('{{#if `bob > 2`}}Bob is bigger than 2{{/if}}')
  , TranslationPass = require('./translation')

//console.log(JSON.stringify(ast, null, '  '))
new TranslationPass(function(s) { process.stdout.write(s); }).accept(ast);

