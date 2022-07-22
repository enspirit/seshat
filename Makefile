ci: npm.install tests.unit bundler.install up waitforseshat tests.integration

npm.install:
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
