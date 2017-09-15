#
# Seshat Dockerfile.hack
#
# This docker file can be used to hack on seshat. It installs
# all the necessary nodejs (seshat) and ruby (its tests) dependencies
# and development tools.
#
FROM phusion/passenger-full:0.9.25

WORKDIR /home/app/webapp
RUN mkdir -p /home/app/webapp/public

# Setup the npm tools
# We use this trick to install dependencies and keep them
# for later docker stages
ADD package.json /tmp/package.json
RUN cd /tmp && npm install
RUN mkdir -p /home/app/webapp && cp -a /tmp/node_modules /home/app/webapp

# Setup the ruby tools
# Similar...
ADD Gemfile /tmp/Gemfile
CMD cd /tmp && bundle install

# Copy the application now, files not necessary won't be copied
# thanks to the .dockerignore file
COPY . /home/app/webapp

# Enable and configure nginx
RUN rm -f /etc/service/nginx/down
RUN rm /etc/nginx/sites-enabled/default
ADD config/nginx.conf /etc/nginx/sites-enabled/webapp.conf

# Run nginx as main component
EXPOSE 80
CMD ["/sbin/my_init"]
