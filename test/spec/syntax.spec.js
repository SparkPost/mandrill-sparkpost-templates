var chai = require('chai')
  , expect = chai.expect
  , fs = require('fs')
  , handlebars = require('handlebars')
  , translation = require('../../lib/translation')
  , SyntaxCheckingPass = require('../../lib/syntax')
  , dumpAST = require('../lib/util')
  , XMAS_TPL_PATH = './test/content/xmastree.html';

function infractionsFrom(test, sentence) {
  var pass = new SyntaxCheckingPass();
  test.ast = handlebars.parse(translation.sourcePrep(sentence));
  pass.accept(test.ast);
  return pass.infractions;
}

function unsupportedHelperStmt(test, helper) {
  var infractions = infractionsFrom(test, '{{' + helper + ' varName}}');
  expect(infractions).to.have.length(1);
  expect(infractions).to.have.deep.property('[0].node.type', 'MustacheStatement')
  expect(infractions).to.have.deep.property('[0].node.path.parts[0]', helper); 
}

function unsupportedHelperBlock(test, helper) {
  var infractions = infractionsFrom(test, '{{#' + helper + ' varName}}body{{/' + helper + '}}');

  expect(infractions).to.have.length(1);
  expect(infractions).to.have.deep.property('[0].node.type', 'BlockStatement')
  expect(infractions).to.have.deep.property('[0].node.path.parts[0]', helper); 
}

function unsupportedHelper(test, helper) {
  unsupportedHelperStmt(test, helper);
  unsupportedHelperBlock(test, helper);
}

function supportedHelperBlock(test, helper) {
  var infractions = infractionsFrom(test, '{{#' + helper + ' arg}}body{{/' + helper + '}}');
  expect(infractions).to.have.length(0);
}

describe('Syntax checking pass', function() {
  afterEach('dump AST on failure', function() {
    dumpAST(this.currentTest, this);
  }); 

  it('should collect partial statements', function() {
    var infractions = infractionsFrom(this, '{{> thisIsAPartial arg1="one" arg2=2}}');
    expect(infractions).to.have.length(1);
    expect(infractions[0].node).to.have.property('type', 'PartialStatement');
  });

  it('should collect partial block statements', function() {
    var infractions = infractionsFrom(this, '{{#> partialBlock arg1="one" arg2=2}}Oopsie text{{/partialBlock}}');
    expect(infractions).to.have.length(1);
    expect(infractions[0].node).to.have.property('type', 'PartialBlockStatement');
  });

  it('should collect unsupported helpers', function() {
    var self = this;
    ['upper', 'lower', 'title', 'url', 'date', 'striptags', 'outOfLeftFieldHelper'].map(
      function(elt) {
        unsupportedHelper(self, elt);
      }
    );
  });

  it('should ignore supported helpers', function() {
    supportedHelperBlock(this, 'if');
    supportedHelperBlock(this, 'each');
  });

  it('should accept all syntax the translator can accept', function() {
    var infractions = infractionsFrom(this, fs.readFileSync(XMAS_TPL_PATH, 'utf8'));
    expect(infractions).to.be.empty;
  });
});

