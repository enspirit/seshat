PROJECT := seshat

DOCKER_COMPONENTS += seshat

##

lint: seshat.lint
lint.fix: seshat.lint.fix

##
seshat_DOCKER_CONTEXT := ./
seshat_DOCKER_FILE := Dockerfile

seshat.tests.unit::
	@docker-compose exec seshat npm run test

seshat.lint::
	@docker-compose exec seshat npm run lint

seshat.lint.fix::
	@docker-compose exec seshat npm run lint:fix

## 
fake-gcs-server_SHELL := sh

