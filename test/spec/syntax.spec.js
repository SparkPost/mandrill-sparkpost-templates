var chai = require('chai')
  , expect = chai.expect
  , handlebars = require('handlebars')
  , SyntaxCheckingPass = require('../../syntax');

function infractionsFrom(sentence) {
  var ast = handlebars.parse(sentence)
    , pass = new SyntaxCheckingPass();
  pass.accept(ast);
  return pass.infractions;
}

function unsupportedHelperStmt(helper) {
  var infractions = infractionsFrom('{{' + helper + ' varName}}');
  expect(infractions).to.have.length(1);
  expect(infractions).to.have.deep.property('[0].type', 'MustacheStatement')
  expect(infractions).to.have.deep.property('[0].path.parts[0]', helper); 
}

function unsupportedHelperBlock(helper) {
  var infractions = infractionsFrom('{{#' + helper + ' varName}}body{{/' + helper + '}}');

  expect(infractions).to.have.length(1);
  expect(infractions).to.have.deep.property('[0].type', 'BlockStatement')
  expect(infractions).to.have.deep.property('[0].path.parts[0]', helper); 
}

function unsupportedHelper(helper) {
  unsupportedHelperStmt(helper);
  unsupportedHelperBlock(helper);
}

function supportedHelperBlock(helper) {
  var infractions = infractionsFrom('{{#' + helper + ' arg}}body{{/' + helper + '}}');
  expect(infractions).to.have.length(0);
}

describe('Syntax checking pass', function() {
  it('should collect partial statements', function() {
    var infractions = infractionsFrom('{{> thisIsAPartial arg1="one" arg2=2}}');
    expect(infractions).to.have.length(1);
    expect(infractions[0]).to.have.property('type', 'PartialStatement');
  });

  it('should collect partial block statements', function() {
    var infractions = infractionsFrom('{{#> partialBlock arg1="one" arg2=2}}Oopsie text{{/partialBlock}}');
    expect(infractions).to.have.length(1);
    expect(infractions[0]).to.have.property('type', 'PartialBlockStatement');
  });

  it('should collect unsupported helpers', function() {
    ['upper', 'lower', 'title', 'url', 'date', 'striptags', 'outOfLeftFieldHelper'].map(unsupportedHelper);
  });

  it('should ignore supported helpers', function() {
    supportedHelperBlock('if');
    supportedHelperBlock('each');
  });
});

