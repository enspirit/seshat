FROM node:10.6

WORKDIR /home/app/webapp

ADD package.json /tmp/package.json
RUN cd /tmp && npm install
RUN mkdir -p /home/app/webapp && cp -a /tmp/node_modules /home/app/webapp

# Setup workdir
COPY . .

# run
EXPOSE 3000
CMD ["./bin/www"]
