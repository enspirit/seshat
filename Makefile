ci: npm.install npm.lint tests.unit bundler.install up waitforseshat tests.integration

npm.install:
	@npm install

npm.lint:
	@npm install

bundler.install:
	@bundle install

waitforseshat:
	@sleep 10

up:
	@docker-compose up -d --force-recreate --build

%.up:
	@docker-compose up -d --force-recreate --build $*

down:
	@docker-compose down

ps:
	@docker-compose ps

%.logs:
	@docker-compose logs -f $*

tests.unit:
	@npm run test

tests.unit.watch:
	@npm run test:watch

tests.integration:
	@bundle exec webspicy formaldoc

tests.integration.watch:
	@bundle exec webspicy formaldoc -w

# The self signed certificates required for the sse-c example
minio/certs/public.crt: generate-keys
minio/certs/private.key: generate-keys

minio/certs/:
	mkdir -p minio/certs

generate-keys: minio/certs/
	openssl req -x509 -config minio/openssl.conf -nodes -days 3650 -newkey rsa:2048 -keyout minio/certs/private.key -out minio/certs/public.crt

Makefile: minio/certs/public.crt minio/certs/private.key
