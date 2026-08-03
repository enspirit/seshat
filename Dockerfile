FROM node:22-alpine as builder

WORKDIR /home/app

COPY package*.json ./
# --ignore-scripts because "prepare" builds, and at this layer the sources it
# needs have not been copied yet. The build happens explicitly below instead.
RUN npm install --ignore-scripts

COPY ./ ./

RUN npm run build
