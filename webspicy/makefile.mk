webspicy_SHELL := sh

webspicy.tests.integration:: webspicy.on
	@docker-compose exec -T \
		-e RESOURCE=${RESOURCE} -e TAG=${TAG} -e LOG_LEVEL=DEBUG \
		webspicy webspicy config.rb
