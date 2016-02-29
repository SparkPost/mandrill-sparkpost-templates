## Prerequisites

 - node 0.12+
 - npm 2.11.3+
 - mocha
 - grunt

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
```

## Running Tests

```bash
npm run test
```
