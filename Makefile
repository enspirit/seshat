install:
	bundle install
	npm install

server:
	NODE_ENV=test ./bin/www & echo "$$!" > "tmp/server.PID"

test: server
	gulp test
	bundle exec rake test
	kill `cat tmp/server.PID`
	rm -rf tmp/*

run:
	./bin/www

watch:
	supervisor ./bin/www
