import http from "http";
import { Server as SocketIOServer } from "socket.io";
import { env } from "./config/env.js";
import { connectDb } from "./config/db.js";
import { createApp } from "./app.js";
import { registerSockets } from "./sockets/index.js";

const server = http.createServer();

const io = new SocketIOServer(server, {
  cors: { origin: env.corsOrigin, credentials: true },
});

registerSockets(io);

const app = createApp({ io });
server.on("request", app);

async function start() {
  await connectDb();
  server.listen(env.port, () => {
    console.log(`Chat API listening on http://localhost:${env.port}`);
    console.log(`Health: http://localhost:${env.port}/health`);
  });
}

start();
