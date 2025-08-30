import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import postsRouter from "./routes/posts.js";
import contactRouter from "./routes/contact.js";
import pollsRouter from "./routes/polls.js";
import announcementsRouter from "./routes/announcements.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// Trust proxy to get real IP addresses
app.set("trust proxy", true);

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

app.listen(PORT, () => {
  console.log(`Freedom Wall API running on port ${PORT}`);
});
