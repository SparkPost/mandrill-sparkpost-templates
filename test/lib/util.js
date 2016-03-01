var fs = require('fs');

function dumpASTFromContext(test, cxt) {
  var astFilename = test.title.replace(/ /g, '-') + '.json';
  if (test.state == 'failed') {
    fs.writeFileSync(astFilename, JSON.stringify(cxt.ast, null,  '  '));
  } else {
    try {
      fs.accessSync(astFilename, fs.F_OK);
      fs.unlinkSync(astFilename);
    } catch(e) {
      // swallow
    }
  }
}

module.exports = dumpASTFromContext;

