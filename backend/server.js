import express from "express";

import cors from "cors";

import dotenv from "dotenv";

import mongoose from "mongoose";

import { createServer } from "http";

import { Server } from "socket.io";

import authRoutes from "./routes/auth.js";

import phoneRoutes from "./routes/phone.js";

dotenv.config();

const app = express();

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "https://778c-2409-40e0-100e-2445-387e-cda9-4ceb-654c.ngrok-free.app"||"http://localhost:5173",

    methods: ["GET", "POST"],
  },
});

// Store online users and their socket IDs

const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("New socket connection:", socket.id);

  socket.on("register", (userId) => {
    // Remove any existing socket connection for this user

    for (const [existingUserId, existingSocketId] of onlineUsers.entries()) {
      if (existingUserId === userId) {
        const existingSocket = io.sockets.sockets.get(existingSocketId);

        if (existingSocket && existingSocket.id !== socket.id) {
          console.log(
            `Disconnecting old socket ${existingSocketId} for user ${userId}`
          );

          existingSocket.disconnect(true);

          onlineUsers.delete(existingUserId);
        }
      }
    }

    // Register new socket

    onlineUsers.set(userId, socket.id);

    console.log(`User ${userId} registered with socket ${socket.id}`);

    console.log("Online users:", Array.from(onlineUsers.entries()));

    // Emit registration confirmation

    socket.emit("registration-success", {
      userId,

      socketId: socket.id,
    });
  });

  socket.on(
    "call-user",
    ({ to, offer, from, callerNumber, recipientNumber }) => {
      const toSocket = onlineUsers.get(to);

      const fromSocket = socket.id;

      console.log("\nCall Flow Status:");

      console.log("====================");

      console.log("Caller ID:", from);

      console.log("Recipient ID:", to);

      console.log("Caller Socket:", fromSocket);

      console.log("Recipient Socket:", toSocket);

      console.log("Caller Number:", callerNumber);

      console.log("Recipient Number:", recipientNumber);

      console.log("Online Users Map:", Array.from(onlineUsers.entries()));

      console.log("====================\n");

      // Check if trying to call yourself

      if (from === to || callerNumber === recipientNumber) {
        console.log("❌ Error: Cannot call yourself");

        socket.emit("call-error", {
          error: "You cannot call yourself",
        });

        return;
      }

      if (toSocket === fromSocket) {
        console.log("❌ Error: Same socket ID detected");

        socket.emit("call-error", {
          error: "Invalid call attempt",
        });

        return;
      }

      if (toSocket) {
        io.to(toSocket).emit("incoming-call", {
          from,

          offer,

          callerNumber,

          recipientNumber,

          callerSocket: fromSocket,
        });

        console.log("✅ Incoming call emitted to socket:", toSocket);

        socket.emit("ringing-started", {
          to,

          recipientNumber,
        });
      } else {
        console.log("❌ Recipient socket not found for user:", to);

        socket.emit("user-not-found", {
          error: "Recipient is offline or not found",
        });
      }
    }
  );

  // Add connection status check event

  socket.on("check-connection", ({ userId }) => {
    const socketId = onlineUsers.get(userId);

    socket.emit("connection-status", {
      connected: !!socketId,

      socketId: socketId,

      userId: userId,
    });
  });

  socket.on("call-accepted", ({ to, answer }) => {
    const toSocket = onlineUsers.get(to);

    if (toSocket) {
      console.log("Call accepted by recipient:", to);

      io.to(toSocket).emit("call-accepted", {
        answer,

        message: "Call connected successfully",
      });
    }
  });

  socket.on("ice-candidate", ({ to, candidate }) => {
    const toSocket = onlineUsers.get(to);

    if (toSocket) {
      io.to(toSocket).emit("ice-candidate", { candidate });
    }
  });

  socket.on("end-call", ({ to }) => {
    const toSocket = onlineUsers.get(to);

    if (toSocket) {
      console.log("Call ended by user");

      io.to(toSocket).emit("call-ended", {
        message: "Call ended by other party",
      });
    }
  });

  socket.on("call-rejected", ({ to }) => {
    const toSocket = onlineUsers.get(to);

    if (toSocket) {
      console.log("Call rejected by recipient:", to);

      io.to(toSocket).emit("call-rejected", {
        message: "Call was rejected by recipient",
      });
    }
  });

  socket.on("disconnect", () => {
    let disconnectedUser;

    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        disconnectedUser = userId;

        break;
      }
    }

    if (disconnectedUser) {
      console.log(
        `User ${disconnectedUser} disconnected from socket ${socket.id}`
      );

      onlineUsers.delete(disconnectedUser);
    }

    console.log("Updated online users:", Array.from(onlineUsers.entries()));
  });

  socket.on("call-timeout", ({ to }) => {
    const toSocket = onlineUsers.get(to);

    if (toSocket) {
      console.log("Call timeout for user:", to);

      io.to(toSocket).emit("call-missed", {
        message: "Missed call",
      });
    }
  });
});

// Middleware

app.use(cors());

app.use(express.json());

// Connect to MongoDB

mongoose

  .connect(process.env.MONGODB_URI)

  .then(() => console.log("Connected to MongoDB"))

  .catch((err) => console.error("MongoDB connection error:", err));

// Routes

app.use("/api/auth", authRoutes);

app.use("/api/phone", phoneRoutes);

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
