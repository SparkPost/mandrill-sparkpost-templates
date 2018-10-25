'use strict';

var SparkPost = require('sparkpost')
  , q = require('q');

function storeSparkPostTemplate(apiKey, tpl, options) {
  var sp = new SparkPost(apiKey, options)
    , deferred = q.defer()
    , response;

  sp.templates.create({template: tpl}, function (err, result) {
    if (err) {
      return deferred.reject({
        name: 'SparkPostError',
        message: err.message,
        error: err,
        response: result.body
      });
    }

    deferred.resolve(result.body);
  });

  return deferred.promise;
}

module.exports = storeSparkPostTemplate;
