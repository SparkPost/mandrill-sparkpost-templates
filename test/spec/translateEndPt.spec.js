var chai = require('chai')
  , expect = chai.expect
  , request = require('request')
  , fs = require('fs')
  , q = require('q')
  , startServer = require('../../server').startServer
  , XMAS_TPL_PATH = './test/content/xmastree.html';

function TestContext(next) {
  var self = this;
  this.port = 3000;
  startServer(function(srv, app) {
    self.srv = srv;
    next();
  });
}

TestContext.prototype.translateTpl = function(tpl) {
  var self = this
    , deferred = q.defer();

  request({
    url: 'http://localhost:' + self.port + '/api/translate',
    method: 'POST',
    json: {
      mandrillTemplate: tpl
    }
  }, function(err, resp, body) {
    if (err) {
      return deferred.reject(err);
    }
    deferred.resolve({resp: resp, body: body});
  });
  return deferred.promise;
};

describe('Translate endpoint', function() {
  beforeEach('Start service', function(done) {
    var self = this;
    self.cxt = new TestContext(done);
  });

  it('should accept POST translate requests', function(done) {
    this.cxt.translateTpl('Hi {{firstName}}').then(function(result) {
      expect(result.body).to.have.property('sparkPostTemplate');
    }).done(done);
  });
});

