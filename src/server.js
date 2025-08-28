import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { WebSocketServer } from "ws";
import { createServer } from "http";
import postsRouter from "./routes/posts.js";
import contactRouter from "./routes/contact.js";
import pollsRouter from "./routes/polls.js";
import announcementsRouter from "./routes/announcements.js";

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 5000;

// WebSocket Server
const wss = new WebSocketServer({ server });

// WebSocket connection handling
wss.on("connection", (ws) => {
  console.log("New WebSocket connection established");

  // Send welcome message
  ws.send(
    JSON.stringify({
      type: "connection",
      message: "Connected to Freedom Wall WebSocket server",
    })
  );

  // Handle incoming messages
  ws.on("message", (data) => {
    try {
      const message = JSON.parse(data);
      console.log("Received WebSocket message:", message);

      // Handle different message types
      switch (message.type) {
        case "subscribe":
          // User wants to subscribe to notifications
          ws.userId = message.userId;
          ws.notificationSettings = message.settings || {};
          console.log(`User ${message.userId} subscribed to notifications`);
          break;
        case "ping":
          // Respond to ping with pong
          ws.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
          break;
        default:
          console.log("Unknown message type:", message.type);
      }
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  });

  // Handle connection close
  ws.on("close", () => {
    console.log("WebSocket connection closed");
  });

  // Handle errors
  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

// Function to broadcast notifications to all connected clients
export const broadcastNotification = (notification) => {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      // 1 = WebSocket.OPEN
      // Check if user has enabled this type of notification
      if (
        client.notificationSettings &&
        client.notificationSettings[notification.type] !== false
      ) {
        client.send(JSON.stringify(notification));
      }
    }
  });
};

// Middleware
// CORS configuration for production
const corsOptions = {
  origin: [
    "http://localhost:3000", // Development
    "http://localhost:5173", // Vite dev server
    "https://isfreedomwall.vercel.app", // Your new Vercel domain
    "https://*.vercel.app", // Vercel preview deployments
    process.env.FRONTEND_URL, // Custom frontend URL from environment
  ].filter(Boolean),
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// API Routes
app.use("/api/v1/posts", postsRouter);
app.use("/api/v1/contact", contactRouter);
app.use("/api/v1/polls", pollsRouter);
app.use("/api/v1/announcements", announcementsRouter);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Freedom Wall API is running" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

server.listen(PORT, () => {
  console.log(`Freedom Wall API running on port ${PORT}`);
  console.log(`WebSocket server ready on ws://localhost:${PORT}`);
});
