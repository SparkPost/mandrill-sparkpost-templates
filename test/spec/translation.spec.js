var chai = require('chai')
  , fs = require('fs')
  , expect = chai.expect
  , handlebars = require('handlebars')
  , TranslationPass = require('../../translation');

function translate(ctx, sentence) {
  ctx.ast = handlebars.parse(sentence)
    , result = [];
    new TranslationPass(function(s) { result.push(s); }).accept(ctx.ast);
  return result.join(''); 
}

describe('Mandrill to SparkPost template translator', function() {
  afterEach('dump AST on failure', function() {
    var astFilename = this.currentTest.title.replace(/ /g, '-') + '.json'
      , ast = this.currentTest.ctx.ast;
    if (this.currentTest.state == 'failed') {
      fs.writeFileSync(astFilename, JSON.stringify(ast, null,  '  '));
    } else {
      try {
        fs.accessSync(astFilename, fs.F_OK);
        fs.unlinkSync(astFilename);
      } catch(e) {
        // swallow
      }
    }
  });

  it('should translate non-template content', function() {
    var sentence = 'This is not <b>template</b> content';
    expect(translate(this, sentence)).to.equal(sentence);
  });

  it('should consume comments', function() {
    expect(translate(this, '{{!-- this is a comment --}}')).to.equal('');
    expect(translate(this, '{{! this is a comment }}')).to.equal('');
  });

  it('should pass through variable statements', function() {
    expect(translate(this, '{{var}}')).to.equal('{{var}}'); 
  })

  it('should translate if blocks', function() {
    expect(translate(this, '{{#if flag}}inside content{{/if}}'))
      .to.equal('{{if flag}}inside content{{end}}');
  });

  it('should translate nested if blocks', function() {
    expect(translate(this, '{{#if lvl1}}{{#if lvl2}}innards{{/if}}{{/if}}'))
      .to.equal('{{if lvl1}}{{if lvl2}}innards{{end}}{{end}}');
  });

  it('should translate each blocks', function() {
    expect(translate(this, '{{#each listOfStuff}}element: {{this}}{{/each}}'))
      .to.equal('{{each listOfStuff}}element: {{loop_var}}{{end}}');
  });

  it('should translate non-each blocks', function() {
  });

  it('should translate nested each blocks', function() {
    expect(translate(this, '{{#each listOfStuff}}{{#each sublist}}{{title}}{{/each}}{{/each}}'))
      .to.equal('{{each listOfStuff}}{{each loop_vars.listOfStuff.sublist}}{{loop_vars.sublist.title}}{{end}}{{end}}');
  });
});

