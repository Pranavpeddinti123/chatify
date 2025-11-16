import express from "express";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import statusRoutes from "./routes/status.route.js"; 
import ragRoutes from "./routes/rag.route.js";

import path from "node:path";
import { connectDB } from "./lib/db.js";
import { ENV } from "./lib/env.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import { app, server, io } from "./lib/socket.js"; 

const __dirname = path.resolve();

// Middleware
app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));
app.use(cors({ origin: ENV.CLIENT_URL, credentials: true }));
app.use(cookieParser());

// ✅ Attach io to req for socket access inside routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/status", statusRoutes); 
app.use("/api/rag", ragRoutes);

const port = ENV.PORT || 3000;

// ✅ Serve frontend in production
if (ENV.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

// Start Server
server.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
  connectDB();
});
