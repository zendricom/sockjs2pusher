import http from "http";
import sockjs from "sockjs";

import sockjs2pusher from "./sockjs2pusher.js";

const webSocketUrl = process.env.WEBSOCKET_URL || "ws://127.0.0.1:6001";
const verbose = Boolean(process.env.VERBOSE);
const heartbeatInterval = /^\d+$/.test(process.env.HEARTBEAT_INTERVAL)
  ? parseInt(process.env.HEARTBEAT_INTERVAL)
  : 100;
const port = /^\d+$/.test(process.env.SOCKJS_PORT)
  ? parseInt(process.env.SOCKJS_PORT)
  : 9999;
const hostname = process.env.SOCKJS_HOSTNAME || "0.0.0.0";
const sockjsPrefix = process.env.SOCKJS_PREFIX || "/sockjs";

// This URL is used by sockjs when using iframe transports
// to load the JS client from
const sockjsUrl =
  process.env.SOCKJS_URL ||
  "https://cdn.jsdelivr.net/npm/sockjs-client@1/dist/sockjs.min.js";

const sockjsServer = sockjs.createServer({
  websocket: false,
  prefix: sockjsPrefix,
  sockjs_url: sockjsUrl,
  log: (...args) => {
    verbose && console.log(...args);
  },
});

sockjs2pusher(sockjsServer, {
  webSocketUrl,
  verbose,
  heartbeatInterval,
});

const server = http.createServer();
sockjsServer.installHandlers(server);
server.listen(port, hostname);
console.log(`Listening on ${hostname}:${port}`);

function shutdown() {
  console.log("Closing server");
  server.close(() => {
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
