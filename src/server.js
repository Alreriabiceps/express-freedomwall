import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";
import postsRouter from "./routes/posts.js";
import contactRouter from "./routes/contact.js";
import pollsRouter from "./routes/polls.js";
import announcementsRouter from "./routes/announcements.js";
import bannedWordsRouter from "./routes/banned-words.js";
import chatRouter from "./routes/chat.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// Trust proxy to get real IP addresses
app.set("trust proxy", true);

// CORS configuration for production
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      "http://localhost:3000", // Development
      "http://localhost:3001", // Vite dev server (port 3001)
      "http://localhost:3002", // Vite dev server (port 3002)
      "http://localhost:5173", // Vite dev server
      "https://isfreedomwall.vercel.app", // Your Vercel domain
      "https://*.vercel.app", // Vercel preview deployments
      process.env.FRONTEND_URL, // Custom frontend URL from environment
    ].filter(Boolean);

    // Check if origin is allowed
    const isAllowed = allowedOrigins.some((allowedOrigin) => {
      if (allowedOrigin.includes("*")) {
        // Handle wildcard domains
        const domain = allowedOrigin.replace("*.", "");
        return origin.endsWith(domain);
      }
      return allowedOrigin === origin;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      console.log("CORS blocked origin:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "user-id", "admin-key"],
};

// Add CORS debugging middleware
app.use((req, res, next) => {
  console.log("Request origin:", req.headers.origin);
  console.log("Request method:", req.method);
  next();
});

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// Create HTTP server for Socket.io
const server = createServer(app);

// Initialize Socket.io with CORS
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
      "http://localhost:5173",
      "https://isfreedomwall.vercel.app",
      "https://*.vercel.app",
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    credentials: false,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "user-id", "admin-key"],
  },
  allowEIO3: true,
  transports: ["websocket", "polling"], // WebSocket first for speed
  pingTimeout: 30000, // Reduced from 60s to 30s
  pingInterval: 10000, // Reduced from 25s to 10s
  connectTimeout: 10000, // 10 second connection timeout
  maxHttpBufferSize: 1e6, // 1MB buffer
  allowUpgrades: true,
  upgrade: true,
  rememberUpgrade: true,
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Socket.io Chat Logic
const onlineUsers = new Map(); // Map to track online users
import ChatMessage from "./models/ChatMessage.js";

// Add connection attempt logging
io.engine.on("connection_error", (err) => {
  console.log("Socket.io connection error:", err);
});

io.engine.on("initial_headers", (headers, req) => {
  console.log("Socket.io initial headers:", headers);
  console.log("Socket.io request origin:", req.headers.origin);
});

io.engine.on("headers", (headers, req) => {
  console.log("Socket.io response headers:", headers);
});

io.engine.on("connection", (socket) => {
  console.log("Socket.io engine connection established:", socket.id);
});

io.on("connection", (socket) => {
  const penName = socket.handshake.query.penName;
  console.log(`User ${penName} connected to world chat`);
  console.log(`Socket ID: ${socket.id}`);
  console.log(`Socket handshake:`, socket.handshake);

  // Add user to online users
  const user = {
    id: socket.id,
    penName: penName,
    joinedAt: new Date(),
  };
  onlineUsers.set(socket.id, user);

  // Broadcast user joined
  socket.broadcast.emit("userJoined", user);

  // Send current online users to the new user
  socket.emit("onlineUsers", Array.from(onlineUsers.values()));

  // Send message history to new user
  ChatMessage.find({ messageType: "user" })
    .sort({ timestamp: -1 })
    .limit(50)
    .lean()
    .then((messages) => {
      const reversedMessages = messages.reverse();
      socket.emit("messageHistory", reversedMessages);
    })
    .catch((err) => {
      console.error("Error fetching message history:", err);
    });

  // Handle new messages
  socket.on("sendMessage", async (messageData) => {
    try {
      // Save message to database
      const chatMessage = new ChatMessage({
        penName: messageData.penName,
        content: messageData.content,
        timestamp: messageData.timestamp,
        messageType: "user",
      });

      await chatMessage.save();

      // Broadcast message to all connected clients
      io.emit("message", {
        id: chatMessage._id,
        penName: chatMessage.penName,
        content: chatMessage.content,
        timestamp: chatMessage.timestamp,
      });
    } catch (error) {
      console.error("Error saving chat message:", error);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  // Handle typing indicators
  socket.on("typingStart", () => {
    socket.broadcast.emit("typingStart", user);
  });

  socket.on("typingStop", () => {
    socket.broadcast.emit("typingStop", user);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`User ${penName} disconnected from world chat`);

    // Remove user from online users
    onlineUsers.delete(socket.id);

    // Broadcast user left
    socket.broadcast.emit("userLeft", user);

    // Update online users for remaining clients
    io.emit("onlineUsers", Array.from(onlineUsers.values()));
  });
});

// API Routes
app.use("/api/v1/posts", postsRouter);
app.use("/api/v1/contact", contactRouter);
app.use("/api/v1/polls", pollsRouter);
app.use("/api/v1/announcements", announcementsRouter);
app.use("/api/v1/banned-words", bannedWordsRouter);
app.use("/api/v1/chat", chatRouter);

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
  console.log(`Freedom Wall API with Socket.io running on port ${PORT}`);
});
