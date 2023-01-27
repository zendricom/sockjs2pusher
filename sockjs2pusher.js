import WebSocket from "ws";

const SOCKJS_READY_STATE_OPEN = 1;
const SOCKJS_READY_STATE_CLOSED = 3;

const defaultOptions = {
  heartbeatInterval: 100,
  verbose: false,
};

class BridgedConnection {
  constructor(sockjsConnection, options) {
    this.sockjsConnection = sockjsConnection;
    this.websocketConnection = null;
    this.options = options;

    this.log("New bridged connection");
    sockjsConnection.on("data", (message) => this.handleSokjsData(message));
    sockjsConnection.on("close", () => this.close("sockjs"));
    sockjsConnection.on("error", (error) => {
      this.log("SOCKJS error", error);
    });
  }

  handleSokjsData(message) {
    this.log("SOCKJS data");
    this.log(message);

    try {
      const messageObject = JSON.parse(message);

      if (messageObject.path) {
        this.connectWebsocket(messageObject.path);
        return;
      }
    } catch (e) {}

    if (
      !this.websocketConnection ||
      this.websocketConnection.readyState !== WebSocket.OPEN
    ) {
      this.log("Unable to forward message - WS not connected");
      return;
    }
    this.websocketConnection.send(message);
    this.armWebsocketHeartbeat();
  }

  handleWebsocketData(message) {
    this.log("WS data");
    this.log("%s", message);

    try {
      const messageObject = JSON.parse(message);

      if (messageObject.event) {
        switch (messageObject.event) {
          case "pusher:ping":
            this.log("Handling pusher ping");
            this.websocketConnection.send(
              '{"event":"pusher:pong","data":"{}"}'
            );
            return;
          case "pusher:pong":
            this.log("Handling pusher pong");
            return;
        }
      }
    } catch (e) {}

    if (
      !this.sockjsConnection ||
      this.sockjsConnection.readyState !== SOCKJS_READY_STATE_OPEN
    ) {
      this.log("Unable to forward message - sockjs not connected");
      return;
    }
    this.sockjsConnection.write(message);
  }

  connectWebsocket(path) {
    this.log("Connecting to WS");
    this.websocketConnection = new WebSocket(this.options.webSocketUrl + path);
    this.websocketConnection.on("open", () => this.log("WS open"));
    this.websocketConnection.on("message", (message) =>
      this.handleWebsocketData(message)
    );
    this.websocketConnection.on("close", () => this.close("websocket"));
    this.websocketConnection.on("error", (error) => {
      this.log("WS error", error);
    });

    this.armWebsocketHeartbeat();
  }

  close(source = "internal") {
    this.log("Close called (source: %s), closing connections", source);
    if (
      this.sockjsConnection &&
      this.sockjsConnection.readyState !== SOCKJS_READY_STATE_CLOSED
    ) {
      this.sockjsConnection.close();
    }
    if (
      this.websocketConnection &&
      this.websocketConnection.readyState !== WebSocket.CLOSED
    ) {
      this.websocketConnection.close();
    }
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
  }

  armWebsocketHeartbeat() {
    if (!this.options.heartbeatInterval) {
      return;
    }

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.heartbeatInterval = setInterval(
      () => this.websocketHeartbeat(),
      this.options.heartbeatInterval * 1000
    );
  }

  websocketHeartbeat() {
    this.log("Sending WS heartbeat");
    if (
      !this.websocketConnection ||
      this.websocketConnection.readyState !== WebSocket.OPEN
    ) {
      this.log("Unable to send heartbeat - WS not connected");
      return;
    }
    //this.websocketConnection.ping();
    this.websocketConnection.send('{"event":"pusher:ping","data":"{}"}');
  }

  log(...args) {
    if (this.options.verbose) {
      console.log(...args);
    }
  }
}

function init(sockjsServer, userOptions) {
  console.log("Starting SockJS to Pusher websocket bridge");

  const options = { ...defaultOptions, ...userOptions };

  sockjsServer.on("connection", function (conn) {
    new BridgedConnection(conn, options);
  });
}

export default init;
