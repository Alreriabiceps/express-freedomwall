import express from "express";
import BannedWord from "../models/BannedWord.js";

const router = express.Router();

// Get all banned words (public - for frontend censoring)
router.get("/", async (req, res) => {
  try {
    const bannedWords = await BannedWord.find({ isActive: true })
      .select("word")
      .lean();

    res.json(bannedWords.map((bw) => bw.word));
  } catch (error) {
    console.error("Error fetching banned words:", error);
    res.status(500).json({ message: "Failed to fetch banned words" });
  }
});

// Get all banned words with details (admin only)
router.get("/admin", async (req, res) => {
  try {
    const adminKey = req.headers["admin-key"];
    if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const bannedWords = await BannedWord.find().sort({ createdAt: -1 });
    res.json(bannedWords);
  } catch (error) {
    console.error("Error fetching banned words:", error);
    res.status(500).json({ message: "Failed to fetch banned words" });
  }
});

// Add new banned word (admin only)
router.post("/", async (req, res) => {
  try {
    const adminKey = req.headers["admin-key"];
    if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { word, reason } = req.body;
    if (!word || !word.trim()) {
      return res.status(400).json({ message: "Word is required" });
    }

    // Check if word already exists
    const existingWord = await BannedWord.findOne({
      word: word.toLowerCase().trim(),
    });

    if (existingWord) {
      return res.status(400).json({ message: "Word already banned" });
    }

    const bannedWord = new BannedWord({
      word: word.toLowerCase().trim(),
      reason: reason?.trim() || "",
    });

    await bannedWord.save();
    res.status(201).json(bannedWord);
  } catch (error) {
    console.error("Error adding banned word:", error);
    res.status(500).json({ message: "Failed to add banned word" });
  }
});

// Update banned word (admin only)
router.put("/:id", async (req, res) => {
  try {
    const adminKey = req.headers["admin-key"];
    if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { word, reason, isActive } = req.body;
    const updates = {};

    if (word !== undefined) updates.word = word.toLowerCase().trim();
    if (reason !== undefined) updates.reason = reason?.trim() || "";
    if (isActive !== undefined) updates.isActive = isActive;

    const bannedWord = await BannedWord.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!bannedWord) {
      return res.status(404).json({ message: "Banned word not found" });
    }

    res.json(bannedWord);
  } catch (error) {
    console.error("Error updating banned word:", error);
    res.status(500).json({ message: "Failed to update banned word" });
  }
});

// Delete banned word (admin only)
router.delete("/:id", async (req, res) => {
  try {
    const adminKey = req.headers["admin-key"];
    if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const bannedWord = await BannedWord.findByIdAndDelete(req.params.id);
    if (!bannedWord) {
      return res.status(404).json({ message: "Banned word not found" });
    }

    res.json({ message: "Banned word deleted successfully" });
  } catch (error) {
    console.error("Error deleting banned word:", error);
    res.status(500).json({ message: "Failed to delete banned word" });
  }
});

export default router;
