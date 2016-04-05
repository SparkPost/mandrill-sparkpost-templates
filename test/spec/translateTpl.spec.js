var chai = require('chai')
  , expect = chai.expect
  , translateTemplate = require('../../lib').translateTemplate
  , mandrillTpl = {
    slug: 'template-101',
    text: '{{#if bob}}Robert!{{/if}}',
    code: '{{#if bob}}<b>Robert!</b>{{/if}}',
    subject: 'Subject',
    from_name: 'From Name',
    from_email: 'from@example.com'
  };

function clone(o) {
  return JSON.parse(JSON.stringify(o));
}

describe('Template translation', function() {
  it('should translate text parts', function() {
    var tpl = clone(mandrillTpl);
    expect(translateTemplate(tpl, {})).to.have.deep.property('content.text')
      .and.not.have.length(0);
  });

  it('should translate HTML parts', function() {
    var tpl = clone(mandrillTpl);
    expect(translateTemplate(tpl, {})).to.have.deep.property('content.html')
      .and.not.have.length(0);
  });

  it('should preserve from addresses', function() {
    var tpl = clone(mandrillTpl)
      , translated = translateTemplate(tpl, {});
    expect(translated).to.have.deep.property('content.from.email').and.equal(mandrillTpl.from_email);
    expect(translated).to.have.deep.property('content.from.name').and.equal(mandrillTpl.from_name);
  });

  it('should not rely on fields other than HTML and text', function() {
    function testOptionalFields(txoptions) {
      var tpl;

      tpl = clone(mandrillTpl);
      delete tpl.subject;
      expect(translateTemplate(tpl, txoptions)).to.have.deep.property('content.subject');
      
      tpl = clone(mandrillTpl);
      delete tpl.from_name;
      expect(translateTemplate(tpl, txoptions)).to.have.deep.property('content.from.name');

      tpl = clone(mandrillTpl);
      delete tpl.from_email;
      expect(translateTemplate(tpl, txoptions)).to.have.deep.property('content.from.email');
    }

    testOptionalFields({});
    testOptionalFields({useSandboxDomain: true});
  });
});

