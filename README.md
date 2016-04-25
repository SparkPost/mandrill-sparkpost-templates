[![Slack Status](http://slack.sparkpost.com/badge.svg)](http://slack.sparkpost.com)

This is a Mandrill to SparkPost email template migration tool.
It supports translation of Mandrill's Handlebars syntax into equivalent SparkPost syntax.

The tool presents a simple web UI for migrating templates directly from your Mandrill account to SparkPost as well as translating Mandrill template text directly into its SparkPost equivalent.

If you want to automate your migration, the tool also has an API.

See below for details on [deployment on Heroku](#heroku-deployment), [manual deployment](#manual-deployment) and [API use](#the-api).

## Supported Features

- *Basic Handlebars syntax:* variables, logic, iteration
- *Logic and iteration:* `if`, `each`
- *Mandrillisms:* `elseif`, backtick conditionals ``` `x < 10` ```
- *Inline helpers:* `upper`, `lower` and `title` are accepted but ignored
- *MailChimp merge tags:* `*|variable_name|*`

## Unsupported Features

- *HTML escaping:* please put your markup in your template
- *Inline helpers:* `url`, `data`, `striptags`
- *Block helpers:* `unless`, `with`

## Heroku Deployment

You can deploy it directly to Heroku: [![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

## Manual Deployment

If you prefer you can deploy it into your own environment using the instructions below.

### Prerequisites

 - node 0.12+
 - npm 2.11.3+

```bash
git clone --recursive https://github.com/SparkPost/mandrill-sparkpost-templates.git
npm install
npm run start
```

You now have a server running on port 3000.

## Usage

### The UI

Once deployed, you can migrate templates between services or translate template text directly
through the web UI.

### The API

If you prefer direct API access or you want to automate your template migration, here's how the API endpoints work.

### API Errors

On error, the API endpoints will return a non-200 status code and a JSON error object containing a list of errors:

```json
{
  "errors": [
    {"message": "Description of a thing that did not work."},
    {"message": "..."}
  ]
}
```

### /api/translate: Template Translation

Accept a Mandrill template and convert it SparkPost format.

Request:

```
POST /api/translate HTTP/1.1
Content-Type: application/json

{
  "mandrillTemplate": "..."
}
```

Successful response:

```
HTTP/1.1 200 OK
Content-Type: application/json

{
  "sparkPostTemplate": "..."
}
```

### /api/migrate: Migration From Mandrill To SparkPost

Extract a template from Mandrill, translate it and import it into SparkPost.

Note: your SparkPost API key must include Templates Read/Write privileges for use with the `migrate` endpoint and the migration UI.

Request:

```
POST /api/migrate HTTP/1.1
Content-Type: application/json

{
  "mandrillAPIKey": "...",
  "mandrillTemplateName": "...",
  "sparkPostAPIKey": "..."
}
```

Successful response:

```
HTTP/1.1 200 OK
Content-Type: application/json

{
  "result": true
}
```

### Contributing

We *welcome* your contributions.  Check out our [contributor notes](CONTRIBUTING.md) for details on how to help out.

### ChangeLog

[See ChangeLog here](CHANGELOG.md)

### Updating Handlebars

If you make a change to the Handlebars subrepo, you must rebuild it:

```bash
npm run buildhb
npm run disthb
```

Remember to commit the updated Handlebars build in vendor/handlebars.

### Running Tests

```bash
npm run test
```
