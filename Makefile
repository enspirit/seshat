install:
	bundle install
	npm install

clean:
	rm -rf tmp/*

test-folders:
	mkdir -p tmp/simplest
	mkdir -p tmp/subfolders

unit-test: test-folders
	gulp test

webspicy: test-folders
	bundle exec rake test

test: unit-test webspicy

run:
	NODE_ENV=test ./bin/www

watch:
	supervisor ./bin/www

image:
	docker build -t enspirit/seshat:latest .

up: test-folders
	docker-compose up -d seshat

down:
	docker-compose stop seshat

restart:
	docker-compose restart seshat

bash:
	docker-compose exec seshat bash
