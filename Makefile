SHELL=/bin/bash -o pipefail
COMPONENTS := seshat webspicy
UP_COMPONENTS := seshat

################################################################################
### Config variables
###

# Load them from an optional .env file
-include .env
.EXPORT_ALL_VARIABLES: ;

# Specify which docker tag is to be used
DOCKER_TAG := $(or ${DOCKER_TAG},${DOCKER_TAG},latest)
DOCKER_REGISTRY := $(or ${DOCKER_REGISTRY},${DOCKER_REGISTRY},q8s.quadrabee.com)

################################################################################
### Main rules
###

# Cleans all compilation and docker assets of all components.
# Make sure you have some time to rebuild them after that ;-)
#
# An individual .clean task exists on each component as well
clean: $(addsuffix .clean,$(COMPONENTS))
	rm **/Dockerfile*.built **/Dockerfile*.log

# Builds all docker images of all components, making sure to rebuild
# everything needed for the last source code to be included.
#
# An individual .image task exists on each component as well
images: $(addsuffix .image,$(COMPONENTS))

# Pushes all docker images of all components to the private registry
#
# An individual .image task exists on each component as well
push-images: $(addsuffix .push,$(COMPONENTS))

# Shortcut over docker-compose ps
ps:
	docker-compose ps

# Puts the software up.
#
# We trust the current docker-compose environment here, and simply
# delegate to api.up. Since we make sure that all images are
# build and --force-recreate is used, the last version of each
# component should be up on success
up: $(addsuffix .image,$(COMPONENTS)) $(addsuffix .up,$(UP_COMPONENTS))
	docker-compose ps

# Puts the entire software down.
#
# All docker containers are stopped.
down:
	docker-compose stop

# Purges all stopped containers and dangling docker images
#
# This rule can be used to get some disk Gb back...
purge:
	docker rmi $$(docker images --filter dangling=true -q 2>/dev/null) 2>/dev/null;\
  docker rm -v $$(docker ps --filter status=exited -q 2>/dev/null) 2>/dev/null

# Restarts the whole software, without rebuilding images.
#
# Handy to get started hacking without waiting too much.
restart: seshat.restart

################################################################################
# Automatic generation of the standard rules
#

# In addition to the main rules above, each architectural component at least
# have the following standard rules, which are dynamically defined below:
#
# - component.image: builds the docker image, rebuilding source code if needed
# - component.down:  shuts down the component
# - component.up:    wakes up the component, making sure the last version runs
# - component.on:    wakes up the component, taking the last known image
# - component.clean: cleans everything, only useful for rebuilding from scratch

# The following macro defines the standard rules
# for a given component, say $1.
define make-goal
$1/Dockerfile.built: $1/Dockerfile $(shell find $1 -type f | grep -v "\/tmp\|\.idea\|\.bundle\|\.log\|\.bash_history\|\.class\|\.pushed\|\.built\|target\|wp-content\|backups\|vendor\|node_modules\|screenshots" | sed 's/ /\\ /g')
	docker build ${$1_BUILD_ARGS} -t $(shell echo $1 | tr A-Z a-z) ./$1 | tee $1/Dockerfile.log
	touch $1/Dockerfile.built

$1.image: $1/Dockerfile.built

# Shuts the component down
$1.down:
	docker-compose stop $1

# Wakes the component up
$1.up: $1.image
	docker-compose up -d --force-recreate $1

# Ensures the component is running
$1.on:
	docker-compose up -d $1

$1.restart:
	docker-compose stop $1
	docker-compose up -d $1

# Show logs in --follow mode for the component
$1.logs:
	docker-compose logs --tail=100 -f $1

# Opens a bash shell on the component
$1.bash:
	docker-compose exec $1 bash

# Removes every compilation/docker assets for the component
$1.clean:
	rm -rf $1/Dockerfile.log $1/Dockerfile.pushed $1/Dockerfile.built

# Pushes the image to the private repository
$1/Dockerfile.pushed: $1/Dockerfile.built
	@if [ -z "$(DOCKER_REGISTRY)" ]; then \
		echo "No private registry defined, ignoring. (set DOCKER_REGISTRY or place it in .env file)"; \
		return 1; \
	fi
	docker tag $1 $(DOCKER_REGISTRY)/$1:$(DOCKER_TAG)
	docker push $(DOCKER_REGISTRY)/$1:$(DOCKER_TAG) | tee -a $1/Dockerfile.log
	touch $1/Dockerfile.pushed

$1.push: $1/Dockerfile.pushed
endef

# Generate all standard rules for all components.
$(foreach component,$(COMPONENTS),$(eval $(call make-goal,$(component))))

test: webspicy.on
	docker-compose exec -T webspicy webspicy config.rb
