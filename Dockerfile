FROM node:24-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY . .

ENV SOCKJS_PORT=80
EXPOSE 80

USER node
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD ["node", "-e", "const port = process.env.SOCKJS_PORT || 80; const prefix = (process.env.SOCKJS_PREFIX || '/sockjs').replace(/\\/$/, ''); fetch('http://127.0.0.1:' + port + prefix + '/info').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"]
CMD [ "node", "server.js" ]
