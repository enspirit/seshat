#
# Seshat Dockerfile
#
# This docker file can be used as a base to use seshat in production.
# It is based on passenger-nodejs, but upgrades to node 9.x to match
# seshat requirements.
#
FROM phusion/passenger-nodejs

WORKDIR /home/app/webapp
RUN mkdir -p /home/app/webapp/public

# Install latest nodejs version
RUN curl -sL https://deb.nodesource.com/setup_9.x | bash -
RUN apt-get install -y nodejs

# Setup the npm tools
# We use this trick to install dependencies and keep them
# for later docker stages
ADD package.json /tmp/package.json
RUN cd /tmp && npm install
RUN mkdir -p /home/app/webapp && cp -a /tmp/node_modules /home/app/webapp

# Enable and configure nginx
RUN rm -f /etc/service/nginx/down
RUN rm /etc/nginx/sites-enabled/default
ADD config/nginx.conf /etc/nginx/sites-enabled/webapp.conf

# Copy the application now, files not necessary won't be copied
# thanks to the .dockerignore file
COPY . /home/app/webapp
RUN chown -R app:app /home/app/webapp

# Run nginx as main component
EXPOSE 80
CMD ["/sbin/my_init"]
