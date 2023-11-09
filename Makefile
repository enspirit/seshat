ci: clamav.up pnpm.install pnpm.build pnpm.lint tests.unit bundler.install up waitforseshat tests.integration

pnpm.install:
	@pnpm install

pnpm.build:
	@pnpm run build

pnpm.lint:
	@pnpm install

bundler.install:
	@bundle install

waitforseshat:
	@sleep 10

up:
	@docker-compose up -d --build

%.up:
	@docker-compose up -d --force-recreate --build $*

%.bash:
	@docker-compose exec $* sh

down:
	@docker-compose down

ps:
	@docker-compose ps

%.logs:
	@docker-compose logs -f $*

tests.unit:
	@pnpm run test

tests.unit.watch:
	@pnpm run test:watch

tests.integration:
	@bundle exec webspicy formaldoc

tests.integration.watch:
	@bundle exec webspicy formaldoc -w

# The self signed certificates required for the sse-c example
minio/certs/public.crt: minio/certs/private.key
minio/certs/private.key:
	mkdir -p minio/certs
	openssl req -x509 -config minio/openssl.conf -nodes -days 3650 -newkey rsa:2048 -keyout minio/certs/private.key -out minio/certs/public.crt

Makefile: minio/certs/public.crt minio/certs/private.key
