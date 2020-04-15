FROM node:12-alpine

WORKDIR /home/app/webapp

ADD package.json /tmp/package.json
RUN cd /tmp && npm install && npm install -g supervisor
RUN mkdir -p /home/app/webapp && cp -a /tmp/node_modules /home/app/webapp

# Setup workdir
COPY . .

# run
EXPOSE 3000
CMD ["./bin/www"]
