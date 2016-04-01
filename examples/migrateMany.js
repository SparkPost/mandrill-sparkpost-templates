'use strict';

var request = require('request')
  , SERVICE_ENDPOINT = 'http://localhost:3000/api'
  , MANDRILL_API_KEY = 'MANDRILL_API_KEY'
  , SPARKPOST_API_KEY = 'SPARKPOST_API_KEY'
  , templates = ['welcome-en', 'welcome-es', 'passwd-reset-en', 'passwd-reset-es'];

// Migrate the first template
migrateTemplate(templates[0]);

function migrateTemplate(template) {
  callMigrateEndpoint(template, MANDRILL_API_KEY, SPARKPOST_API_KEY, migrationComplete);
}

// Report on the last migration and migrate the next template
function migrationComplete(err) {
  if (err) {
    console.error('Migration of template "' + templates[0] + '" failed: ' + err);
    // Fallthrough
  } else {
    console.log('Migrated template ' + templates[0]);
  }

  templates.shift();

  if (templates.length > 0) {
    migrateTemplate(templates[0]);
  }
}

// Call /api/migrate wih the given arguments, calling done on completion.
function callMigrateEndpoint(tplName, mandrillAPIKey, sparkPostAPIKey, done) {
  request({
    method: 'POST',
    url: SERVICE_ENDPOINT + '/migrate',
    json: true,
    body: {
      mandrillAPIKey: mandrillAPIKey,
      mandrillTemplateName: tplName,
      sparkPostAPIKKey: sparkPostAPIKey 
    }
  }, done);
}
