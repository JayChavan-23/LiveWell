// src/socket.js
import { Server } from "socket.io";

const connectedUsers = new Map(); // uid → socket.id

let io;

/**
 * Initialize Socket.IO and attach to the Express server
 */
export function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*", // change to your frontend URL in production
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Basic auth: client sends userId right after connecting
    socket.on("register", (uid) => {
      connectedUsers.set(uid, socket.id);
      console.log(`[Socket] Registered user ${uid}`);
    });

    socket.on("disconnect", () => {
      for (const [uid, sid] of connectedUsers.entries()) {
        if (sid === socket.id) {
          connectedUsers.delete(uid);
          console.log(`[Socket] User ${uid} disconnected`);
          break;
        }
      }
    });
  });

  console.log("[Socket] Initialized successfully");
  return io;
}

/**
 * Emit an event to a specific user if online
 */
export function emitToUser(uid, event, data) {
  if (!io) return;
  const socketId = connectedUsers.get(uid);
  if (socketId) {
    io.to(socketId).emit(event, data);
    console.log(`[Socket] Emitted ${event} → ${uid}`);
  } else {
    console.log(`[Socket] User ${uid} offline; nudge stored only.`);
  }
}

/**
 * Get list of connected users (for debugging)
 */
export function getConnectedUsers() {
  return Array.from(connectedUsers.keys());
}
