FROM node:15.2-alpine

WORKDIR /home/app

RUN apk add --no-cache bash

COPY package.json ./

RUN npm install

COPY . ./

CMD ["npm", "start"]
