FROM node:20-alpine as builder

WORKDIR /home/app

COPY package*.json ./
RUN npm install

COPY ./ ./

RUN npm run build
