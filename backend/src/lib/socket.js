import { Server } from "socket.io";
import http from "http";
import express from "express";
import Group from "../models/group.model.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [process.env.CLIENT_URL || "http://localhost:5173"],
  },
});

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

const userSocketMap = {};

io.on("connection", async (socket) => {
  // console.log("A user connected:", socket.id);
  const userId = socket.handshake.query.userId;
  if (userId) {
    userSocketMap[userId] = socket.id;

    // Auto-join user to all their group rooms
    try {
      const userGroups = await Group.find({ members: userId }).select("_id");
      userGroups.forEach((group) => {
        socket.join(`group:${group._id}`);
      });
    } catch (error) {
      console.error("Error joining group rooms on connect:", error.message);
    }
  }

  // io.emit() is used to broadcast messages to all connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    // console.log("A user disconnected", socket.id);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };
