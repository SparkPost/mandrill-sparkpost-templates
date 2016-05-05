var handlebars = require('handlebars')
  , fs = require('fs');

console.log(
  JSON.stringify(
    handlebars.parse(
      fs.readFileSync(process.argv[2], 'utf8')
    ), null, '  '
  )
);

