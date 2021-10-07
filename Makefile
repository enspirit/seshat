SHELL=/bin/bash -o pipefail
COMPONENTS := seshat webspicy
UP_COMPONENTS := seshat

################################################################################
### Config variables
###

.EXPORT_ALL_VARIABLES: ;

# Specify which docker tag is to be used
DOCKER_TAG := $(or ${DOCKER_TAG},${DOCKER_TAG},latest)
DOCKER_REGISTRY := $(or ${DOCKER_REGISTRY},${DOCKER_REGISTRY},docker.io)

################################################################################
### Main rules
###

images: seshat.image webspicy.image

push-images: seshat.push

# Shortcut over docker-compose ps
ps:
	docker-compose ps

up: images
	docker-compose up -d --force-recreate

down:
	docker-compose stop

restart:
	docker-compose stop seshat
	docker-compose up -d seshat

################################################################################
### Docker rules
###

seshat.image:
	docker build -t seshat/seshat .

webspicy.image:
	docker build -t seshat/webspicy webspicy/

lint:
	docker-compose exec -T seshat npm run lint

lint.fix:
	docker-compose exec -T seshat npm run lint:fix

test-folders:
	mkdir -p volumes/seshat/simplest
	mkdir -p volumes/seshat/simplest/old
	mkdir -p volumes/seshat/simplest/donotoverride
	mkdir -p volumes/seshat/subfolders

test-files: test-folders
	touch volumes/seshat/simplest/old.txt
	touch volumes/seshat/simplest/donotoverride.txt

test.unit:
	docker-compose exec -T seshat npm run test
	docker-compose exec -T seshat npm run test:coverage

test.integration: test-files
	docker-compose exec -T webspicy webspicy config.rb

test: test.unit test.integration

release: seshat.image
	docker tag seshat/seshat enspirit/seshat:$(DOCKER_TAG)
	docker push enspirit/seshat:$(DOCKER_TAG)

