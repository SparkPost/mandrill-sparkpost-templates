[![Slack Status](http://slack.sparkpost.com/badge.svg)](http://slack.sparkpost.com)

This is a Mandrill to SparkPost email template migration tool.
It enables translation of Mandrill's Handlebars syntax into equivalent [SparkPost Template Language](https://developers.sparkpost.com/api/template-language/) syntax.

It can migrate templates directly from your Mandrill account to SparkPost using the simple UI. It can also translate Mandrill template content directly into its SparkPost equivalent.

If you want to automate your migration, the tool also has [an API](#the-api).

See below for details on [deployment](#deployment), [Heroku deployment](#heroku-deployment).

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

## Deployment

Deploy it locally or on another environment using the instructions below.

### Prerequisites

 - node 0.12+
 - npm 2.11.3+

```bash
git clone --recursive https://github.com/SparkPost/mandrill-sparkpost-templates.git
cd mandrill-sparkpost-templates
npm install
npm run start
```

You now have a server running on port `3000`.

## Heroku Deployment

You can also deploy it directly to Heroku: [![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

## Usage

### The UI

Once deployed, you can migrate templates between services or translate template content directly
through the UI hosted on port `3000`.

### The API

If you prefer direct API access to automate your template migration, here's how the API endpoints work:

#### /api/translate: Template Translation

Accepts a Mandrill template and converts it SparkPost format.

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

#### /api/migrate: Migration From Mandrill To SparkPost

Extracts a template from Mandrill, translates it and imports it into SparkPost. Your SparkPost API key must include Templates Read/Write permission in order to add templates to the account. Manage your API keys from the [API Keys page](https://app.sparkpost.com/account/api-keys)([EU](https://app.eu.sparkpost.com/account/api-keys)).

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

#### API Errors

On error the API endpoints will return a non-200 status code and a JSON error object containing a list of errors:

```json
{
  "errors": [
    {"message": "Description of a thing that did not work."},
    {"message": "..."}
  ]
}
```

### Contributing

We *welcome* your contributions. Check out our [contributor notes](CONTRIBUTING.md) for details on how to help out.

### ChangeLog

[See ChangeLog here](CHANGELOG.md)
