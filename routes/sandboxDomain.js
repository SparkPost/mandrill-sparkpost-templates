'use strict';

var router = require('express').Router();

// Response: {sandboxDomain: process.env.SPARKPOST_SANDBOX_DOMAIN || 'sparkpostbox.com'}
router.get('/', function(req, res) {
  var domain = 'sparkpostbox.com';
  if (process.env.SPARKPOST_SANDBOX_DOMAIN) {
    domain = process.env.SPARKPOST_SANDBOX_DOMAIN;
  }
  res.json({sandboxDomain: domain});
});

module.exports = router;
