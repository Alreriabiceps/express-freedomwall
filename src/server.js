import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import postsRouter from "./routes/posts.js";
import contactRouter from "./routes/contact.js";
import pollsRouter from "./routes/polls.js";
import announcementsRouter from "./routes/announcements.js";
import bannedWordsRouter from "./routes/banned-words.js";

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
app.use("/api/v1/banned-words", bannedWordsRouter);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Freedom Wall API is running" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

app.listen(PORT, () => {
  console.log(`Freedom Wall API running on port ${PORT}`);
});
