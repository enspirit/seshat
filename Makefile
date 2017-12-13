install:
	bundle install
	npm install

server:
	NODE_ENV=test ./bin/www & echo "$$!" > "tmp/server.PID"

test: server
	mkdir -p tmp/simplest
	mkdir -p tmp/subfolders
	gulp test
	bundle exec rake test
	kill `cat tmp/server.PID`
	rm -rf tmp/*

run:
	./bin/www

watch:
	supervisor ./bin/www
