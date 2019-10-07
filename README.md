# Seshat - Easy attachement upload/download

Seshat is a simple docker container to manage file uploads/downloads for
long-lived user attachments.

## Dependencies

To install the dependencies, run `make install`

Some of the dependencies on this project depend on the package `fiber` that is incompatible with some versions of node.
It is recommended to use node v10.6.x with this project.

## Unit tests

`make unit-test`

## Webspicy

To run the webspicy test, make sure to run sehsat in a terminal by using `make run`, then in another terminal run `make webspicy`

## Build the docker image

`make image`

## Push the docker image to the q8s registry

`make push`
