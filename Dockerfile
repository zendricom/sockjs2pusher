FROM node:16-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install && npm cache clean --force

COPY *.js .

ENV SOCKJS_PORT 80
EXPOSE 80

USER node
CMD [ "node", "server.js" ]

