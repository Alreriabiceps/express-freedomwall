import express from "express";
import ChatMessage from "../models/ChatMessage.js";

const router = express.Router();

// Check if pen name is available (unique)
router.post("/check-penname", async (req, res) => {
  try {
    const { penName } = req.body;

    if (!penName || penName.trim().length === 0) {
      return res.status(400).json({
        available: false,
        message: "Pen name is required",
      });
    }

    if (penName.length > 20) {
      return res.status(400).json({
        available: false,
        message: "Pen name must be 20 characters or less",
      });
    }

    // Check if pen name is already in use by an active user
    // Look for recent messages (within last 24 hours) with this pen name
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const existingUser = await ChatMessage.findOne({
      penName: penName.trim(),
      timestamp: { $gte: twentyFourHoursAgo },
    });

    if (existingUser) {
      return res.status(400).json({
        available: false,
        message: "Pen name is already in use. Please choose a different one.",
      });
    }

    res.json({
      available: true,
      message: "Pen name is available",
    });
  } catch (error) {
    console.error("Error checking pen name:", error);
    res.status(500).json({
      available: false,
      message: "Server error",
    });
  }
});

// Get recent message history
router.get("/history", async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const messages = await ChatMessage.find({ messageType: "user" })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .select("penName content timestamp")
      .lean();

    // Reverse to show oldest first
    const reversedMessages = messages.reverse();

    res.json(reversedMessages);
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({
      message: "Failed to fetch chat history",
    });
  }
});

// Get online users count (for stats)
router.get("/online-count", async (req, res) => {
  try {
    // This will be handled by Socket.io, but we can provide a basic endpoint
    res.json({
      onlineCount: 0, // Will be updated by Socket.io
      message: "Use Socket.io for real-time online count",
    });
  } catch (error) {
    console.error("Error getting online count:", error);
    res.status(500).json({
      message: "Failed to get online count",
    });
  }
});

export default router;
