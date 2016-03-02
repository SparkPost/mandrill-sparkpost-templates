## Prerequisites

 - node 0.12+
 - npm 2.11.3+
 - mocha
 - grunt
 - browserify

## Setup

```bash
git clone --recursive https://github.com/ewandennis/mandrill2sparkpost.git
cd handlebars
git checkout mandrill
# submodule calls needed?  The checkout is recursive.
git submodule init
git submodule update --recursive
npm install
grunt
cd ..
npm install
npm run build
npm run dev
```

You now have a server running on port 3000.

## The API

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

## Running Tests

```bash
npm run test
```
