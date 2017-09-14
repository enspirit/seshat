install:
	bundle install
	npm install

test:
	bundle exec rake test

run:
	./bin/www

watch:
	supervisor ./bin/www
