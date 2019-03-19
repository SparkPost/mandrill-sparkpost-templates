var chai = require('chai')
  , expect = chai.expect
  , handlebars = require('handlebars')
  , translation = require('../../lib/translation')
  , dumpAST = require('../lib/util');

function translate(ctx, sentence) {
  ctx.ast = handlebars.parse(translation.sourcePrep(sentence))
    , result = [];
    new translation.TranslationPass(function(s) { result.push(s); }).accept(ctx.ast);
  return result.join(''); 
}

describe('Mandrill template source prep', function() {
  it('should translate {{elseif ...}} to {{else if ...}}', function() {
    expect(translation.sourcePrep('{{#if x}}x{{elseif y}}y{{/if}}'))
      .to.equal('{{#if x}}x{{else if y}}y{{/if}}');
  });

  it('should translate multiple instances of elseif', function() {
    expect(translation.sourcePrep('{{#if x}}x{{elseif y}}y{{elseif z}}z{{/if}}'))
      .to.equal('{{#if x}}x{{else if y}}y{{else if z}}z{{/if}}');
  });

  it('should translate over multiple lines', function() {
    expect(translation.sourcePrep('{{#if x}}\n\tx\n{{elseif y}}\n\ty\n{{elseif z}}\n\tz\n{{/if}}\n'))
      .to.equal('{{#if x}}\n\tx\n{{else if y}}\n\ty\n{{else if z}}\n\tz\n{{/if}}\n');
  });

  it('should translate MailChimp merge tags into handlebars form', function() {
    expect(translation.sourcePrep('*|mergeTag|*')).to.equal('{{mergeTag}}');
  });

  it('should support MailChimp merge tag names containing underscores', function() {
    expect(translation.sourcePrep('*|merge_tag|*')).to.equal('{{merge_tag}}');
  });

  it('should support MailChimp conditionals merge tags', function() {
    expect(translation.sourcePrep('*|IF:X|*\n\tx\n*|ELSE:|*\n\ty\n*|END:IF|*'))
      .to.equal('{{#if X}}\n\tx\n{{else}}\n\ty\n{{/if}}');
    expect(translation.sourcePrep('*|IF:MERGE=x|*\n\tx\n*|ELSEIF:MERGE=y|*\n\ty\n*|END:IF|*'))
      .to.equal('{{#if MERGE=x}}\n\tx\n{{else if MERGE=y}}\n\ty\n{{/if}}');
  });
});

describe('Mandrill to SparkPost template translator', function() {
  afterEach('dump AST on failure', function() {
    dumpAST(this.currentTest, this);
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
  });

  it('should translate supported inline helpers', function() {
    ['upper', 'lower', 'title'].forEach(function(helper) {
      expect(translate(this, '{{' + helper + ' arg}}'))
        .to.equal('{{arg}}');
    });
  });

  it('should translate if blocks', function() {
    expect(translate(this, '{{#if flag}}inside content{{/if}}'))
      .to.equal('{{if flag}}inside content{{end}}');
  });

  it('should translate nested if blocks', function() {
    expect(translate(this, '{{#if lvl1}}{{#if lvl2}}innards{{/if}}{{/if}}'))
      .to.equal('{{if lvl1}}{{if lvl2}}innards{{end}}{{end}}');
  });

  it('should translate ifs with backtick conditionals', function() {
    expect(translate(this, '{{#if `x > 10`}}x is bigger than ten{{/if}}'))
      .to.equal('{{if x > 10}}x is bigger than ten{{end}}');
  });

  it('should translate if-elseif blocks', function() {
    expect(translate(this, '{{#if x}}x{{elseif y}}y{{/if}}'))
      .to.equal('{{if x}}x{{else}}{{if y}}y{{end}}{{end}}');
  });

  it('should translate nested if-elseif main blocks', function() {
    expect(translate(this, '{{#if x}}x{{#if xx}}xx{{elseif yy}}yy{{/if}}{{elseif y}}y{{/if}}'))
      .to.equal('{{if x}}x{{if xx}}xx{{else}}{{if yy}}yy{{end}}{{end}}{{else}}{{if y}}y{{end}}{{end}}');
  });

  it('should translate nested if-elseif inverse blocks', function() {
    expect(translate(this, '{{#if x}}x{{elseif y}}y{{#if xx}}xx{{elseif yy}}yy{{/if}}{{/if}}'))
      .to.equal('{{if x}}x{{else}}{{if y}}y{{if xx}}xx{{else}}{{if yy}}yy{{end}}{{end}}{{end}}{{end}}');
  });

  it('should translate each blocks', function() {
    expect(translate(this, '{{#each listOfStuff}}element: {{this}}{{/each}}'))
      .to.equal('{{each listOfStuff}}element: {{loop_var}}{{end}}');
  });

  it('should translate non-each blocks', function() {
    expect(translate(this, '{{#arr}}{{this}}{{/arr}}')).to.equal('{{each arr}}{{loop_var}}{{end}}');
  });

  it('should translate nested each blocks', function() {
    expect(translate(this, '{{#each listOfStuff}}{{#each sublist}}{{title}}{{/each}}{{/each}}'))
      .to.equal('{{each listOfStuff}}{{each loop_vars.listOfStuff.sublist}}{{loop_vars.sublist.title}}{{end}}{{end}}');
  });

  it('should translate handlebars 0-indexed arrays to SparkPost 1-indexed arrays', function() {
    expect(translate(this, '{{arr.[0].subArr.[10]}}'))
      .to.equal('{{arr[1].subArr[11]}}');
  });

  it('should preserve whitespace around translated tags', function() {
    var ifclause = '\n text'
      , elseclause = ' \n else stuff';
    expect(translate(this, '{{#if x}}' + ifclause + '{{else}}' + elseclause + '{{/if}}'))
      .to.equal('{{if x}}' + ifclause + '{{else}}' + elseclause + '{{end}}');
  });
});

