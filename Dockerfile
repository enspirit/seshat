FROM node:17.9.0-alpine

WORKDIR /home/app/webapp

RUN apk add --no-cache bash

COPY . ./

RUN npm install

CMD ["npm", "start"]
