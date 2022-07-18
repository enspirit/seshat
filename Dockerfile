FROM node:16-alpine as builder

WORKDIR /home/app
COPY ./ ./
RUN npm run build
RUN npm pack

FROM node:16-alpine

COPY --from=builder /home/app/enspirit-seshat-*.tgz /tmp
RUN npm install --location=global /tmp/enspirit-seshat*