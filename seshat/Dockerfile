FROM node:15.2-alpine

WORKDIR /home/app

RUN apk add --no-cache bash

COPY . ./

RUN npm install

CMD ["npm", "start"]
