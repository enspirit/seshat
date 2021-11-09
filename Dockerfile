FROM node:15.2-alpine

WORKDIR /home/app/webapp

RUN apk add --no-cache bash

# npm install will run npm prepare which require the src files

COPY . ./

RUN npm install

CMD ["npm", "start"]
