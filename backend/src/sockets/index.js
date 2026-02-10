// src/sockets/index.js
import { Server } from "socket.io";

export function initSocket(server) {
  // Allow both 3000 (React dev) and 8080 (static test) origins
  const io = new Server(server, {
    path: "/socket.io",
    cors: {
      origin: [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://192.168.1.110/"
      ],
      methods: ["GET", "POST"],
      credentials: false,
    },
  });

  io.on("connection", (socket) => {
    console.log("[socket] connected", socket.id);
    socket.emit("welcome", { id: socket.id, msg: "hello from live-well-backend" });

    socket.on("ping", () => socket.emit("pong", true));
    socket.on("echo", (p) => socket.emit("echo", p));
    socket.on("disconnect", (r) =>
      console.log("[socket] disconnected", socket.id, r)
    );
  });

  console.log("[socket] initialized with CORS whitelist:", io.opts.cors.origin);
  return io;
}
