Small WebRTC point-to-point messaging experiment.

The server side contains a WebSocket based signalling service and a STUN server to coordinate peer connections.

Run it with:
```
cd server
cargo run
```

The client side contains a simple React interface to connect to another peer and send messages through.

Set up the correct hostname to contact the server in `client/src/config.json`
Run it with:
```
cd client
yarn && yarn start
```

Opening a server and two client pages will allow you to connect two clients together and exchange messages.
