# sockjs2pusher
A simple sockjs server adapter, which forwards messages to a pusher-channels-protocol websocket server.

## Why would I need this?
There are multiple open-source, self-deployable Pusher Channels replacements, including the popular [soketi](https://github.com/soketi/soketi) and [Laravel WebSockets](https://github.com/beyondcode/laravel-websockets) projects. 

Unfortunately, all of them only implement the websocket transports (wss, ws) and are missing the fallbacks which you get with the Pusher Channels service (xhr_polling, xhr_streaming, sockjs).

While there are basically no browsers in use anymore, that don't support them, websocket connections are being blocked in some security environments.
Use *sockjs2pusher* to provide affected users with real-time data.

## Running the server
### Run the provided server.js
 Run `npm install` to install the requirements.

Then, check the server.js source code and adapt it to your needs. You can provide the required configuration in the source code or pass them as environment variables:

* `WEBSOCKET_URL` - URL (without path) where your websocket server is running. `[ws://127.0.0.1:6001]`
* `SOCKJS_HOSTNAME` - SockJS HTTP server IP address to bind to `[0.0.0.0]`
* `SOCKJS_PORT` - SockJS HTTP server port to listen on [`9999`]
* `SOCKJS_PREFIX` - Path / Prefix for SockJS requests [`/sockjs`]
* `HEARTBEAT_INTERVAL` - A pusher:ping is being sent to the websocket to ensure it does not close the connection [`100`]
(disable with `0`)
* `VERBOSE` - Enables logging of connection / message events. Useful for debugging [`0`]

Example: `WEBSOCKET_URL=ws://ws.server:6001 SOCKJS_PORT=9900 node server.js`

### Build a Docker container
1. Run `docker build -t sockjs2pusher .`
2. Run `docker run --rm -e VERBOSE=1 -e WEBSOCKET_URL='ws://websocket:6001' -p 9999:80 sockjs2pusher`

## Configuring the pusher-js client
### Activating and configuring the transport
Finally, you can enable `sockjs` as transport in your pusher config and configure the http parameters.

    let pusher = new Pusher('app-key', {
        wsHost: 'my.ws.endpoint',
        wsPort: 6001,
        enabledTransports: ['wss', 'ws', 'sockjs'],
        httpHost: 'my.sockjs2pusher.endpoint',
        httpPort: 9999,
        httpPath: '/sockjs',
        ...
    });
`httpHost`, `httpPort` and `httpPath` will be passed to sockjs by pusher-js.
 > :information_source: &nbsp;If you are using [Laravel Echo](https://github.com/laravel/echo), you can pass the exact same options to Echo instead.


### Preloading the SockJS library
When pusher-js switches to the sockjs fallback, it will load the sockjs library from Pusher's servers.
To prevent that, we can make sure, that the library is already present.

* Either add a script tag to load the library from your own server or a CDN:
`<script src="https://cdn.jsdelivr.net/npm/sockjs-client@1/dist/sockjs.min.js"></script>`

* Or bundle it to your application by installing and exposing it (`npm install `)

 > :warning: We've had problems with the sockjs client loaded from Pusher so we recommend preloading your own.

## a note on SSL
We recommend running the server behind a reverse proxy which can do the SSL termination.

Use a [node https server](https://nodejs.org/api/https.html#httpscreateserveroptions-requestlistener) instead of the http server, if you want to encrypt connections yourself.

## License
This project is licensed under the MIT License - see the LICENSE file for details.