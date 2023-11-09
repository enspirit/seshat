FROM node:16-alpine as builder

RUN npm install -g pnpm

WORKDIR /home/app

COPY packages ./packages
COPY pnpm-* package*.json ./
COPY services/server/package*.json ./services/server/
RUN pnpm install

COPY ./ ./

RUN pnpm run build
