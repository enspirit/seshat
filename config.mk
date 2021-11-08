PROJECT := seshat

DOCKER_COMPONENTS += seshat

##

lint: seshat.lint
lint.fix: seshat.lint.fix

##
seshat_DOCKER_CONTEXT := ./
seshat_DOCKER_FILE := Dockerfile

seshat.tests.unit::
	@docker-compose exec -T seshat npm run test

seshat.lint::
	@docker-compose exec -T seshat npm run lint

seshat.lint.fix::
	@docker-compose exec -T seshat npm run lint:fix

##
fake-gcs-server_SHELL := sh

##

tests.prepare: test-folders test-files fake-gcs-server.restart
tests.integration:: tests.prepare

test-folders:
	@rm -rf volumes/seshat/* || true
	@mkdir -p volumes/seshat/local/optional
	@mkdir -p volumes/seshat/local/simplest/old
	@mkdir -p volumes/seshat/local/simplest/donotoverride
	@mkdir -p volumes/seshat/subfolders
	@mkdir -p volumes/seshat/gcs/seshat/subfolder

test-files: test-folders
	@touch volumes/seshat/local/simplest/old.txt
	@touch volumes/seshat/local/simplest/report.csv
	@touch volumes/seshat/local/simplest/donotoverride.txt
	@touch volumes/seshat/gcs/seshat/subfolder/other-file.js

##
release: seshat.image
	docker tag seshat/seshat:${DOCKER_TAG} enspirit/seshat:${DOCKER_TAG}
	docker push enspirit/seshat:${DOCKER_TAG}
