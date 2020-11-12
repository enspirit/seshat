# Skeleton

This is a skeleton of a nodejs project with:

* Babel 7.x
* Mocha 8.x
* Chai 4.x
* Eslint (with enspirit's config)

# Commands

## Run the app:
Command: `npm start`

## Run the tests:
Command: `npm test`

## Run the tests (+ watch for file changes & rerun):
Command: `npm run test:watch`

A report will be generated in `tests/test-results.xml`. This file is compatible with jenkins' junit plugin.

## Run the tests (+ output coverage report):
Command: `npm run test:coverage`

The coverage report will be generated in the folder `coverage/`.
