var mandrill = require('mandrill-api')
  , q = require('q');

function extractMandrillTemplate(apiKey, templateName) {
  return q.Promise(function(resolve, reject) {
    var client = new mandrill.Mandrill(apiKey);
    client.templates.info({name: templateName}, function(result) {
      resolve(result);
    }, function(e) {
      reject({
        name: 'MandrillError',
        message: e.message,
        error: e
      });
    });
  });
}

module.exports = extractMandrillTemplate;

