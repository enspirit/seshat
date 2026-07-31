FROM node:22-alpine as builder

WORKDIR /home/app

COPY package*.json ./
RUN npm install

COPY ./ ./

RUN npm run build
