var handlebars = require('handlebars')
  , fs = require('fs');

console.log(
  JSON.stringify(
    handlebars.parse(
      //fs.readFileSync(process.argv[2], 'utf8')
      //process.argv[3]
      "{{#if x}}x{{#if xx}}xx{{else if y}}yy{{/if}}{{else}}y{{/if}}"
    ), null, '  '
  )
);

