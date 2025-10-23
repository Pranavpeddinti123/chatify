import { Server } from "socket.io";
import http from "http";
import express from "express";
import { ENV } from "./env.js";
import { socketAuthMiddleware } from "../middleware/socket.auth.middleware.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [ENV.CLIENT_URL],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.use(socketAuthMiddleware);

const userSocketMap = {}; // { userId: socketId }

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

io.on("connection", (socket) => {
  const userId = socket.userId;
  userSocketMap[userId] = socket.id;
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });

  // --- Signaling ---
  socket.on("call:user", ({ to, offer, type }) => {
    const receiverSocketId = userSocketMap[to];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("call:incoming", {
        from: socket.userId,
        offer,
        name: socket.user.fullName,
        type,
      });
    } else {
      socket.emit("call:error", { message: "User not available" });
    }
  });

  socket.on("call:answer", ({ to, answer }) => {
    const receiverSocketId = userSocketMap[to];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("call:answer", { // must match frontend!
        from: socket.userId,
        answer,
      });
    }
  });

  socket.on("call:ice-candidate", ({ to, candidate }) => {
    const receiverSocketId = userSocketMap[to];
    if (receiverSocketId && candidate) {
      io.to(receiverSocketId).emit("call:ice-candidate", {
        from: socket.userId,
        candidate,
      });
    }
  });

  // Call end / decline / hangup
  socket.on("call:ended", ({ to }) => {
    const receiverSocketId = userSocketMap[to];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("call:ended", { from: socket.userId });
    }
  });
});

export { io, app, server };
