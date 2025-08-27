import express from "express";
import Announcement from "../models/Announcement.js";
import { getPostsRateLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// ===== PUBLIC ROUTES =====

// GET /api/v1/announcements - Get active announcements for users
router.get("/", getPostsRateLimiter, async (req, res) => {
  try {
    const now = new Date();

    // Get active announcements that haven't expired
    const announcements = await Announcement.find({
      isActive: true,
      $or: [
        { expiresAt: null }, // No expiration
        { expiresAt: { $gt: now } }, // Not expired yet
      ],
    }).sort({ createdAt: -1 });

    res.json(announcements);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching announcements",
      error: error.message,
    });
  }
});

// ===== ADMIN ROUTES =====

// GET /api/v1/announcements/admin - Admin endpoint to see all announcements
router.get("/admin", async (req, res) => {
  try {
    const adminKey = req.headers["admin-key"];
    if (adminKey !== process.env.ADMIN_KEY || !adminKey) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const announcements = await Announcement.find({}).sort({ createdAt: -1 });
    res.json(announcements);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching announcements",
      error: error.message,
    });
  }
});

// POST /api/v1/announcements - Admin create new announcement
router.post("/", async (req, res) => {
  try {
    const adminKey = req.headers["admin-key"];
    if (adminKey !== process.env.ADMIN_KEY || !adminKey) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { title, message, type, expiresAt, adminNotes } = req.body;

    // Validate required fields
    if (!title || !message) {
      return res.status(400).json({
        message: "Title and message are required",
      });
    }

    // Create announcement
    const announcement = new Announcement({
      title,
      message,
      type: type || "info",
      expiresAt: expiresAt || null,
      adminNotes: adminNotes || "",
    });

    await announcement.save();
    res.status(201).json(announcement);
  } catch (error) {
    res.status(500).json({
      message: "Error creating announcement",
      error: error.message,
    });
  }
});

// PUT /api/v1/announcements/:id - Admin update announcement
router.put("/:id", async (req, res) => {
  try {
    const adminKey = req.headers["admin-key"];
    if (adminKey !== process.env.ADMIN_KEY || !adminKey) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { title, message, type, expiresAt, isActive, adminNotes } = req.body;

    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    // Update fields
    if (title !== undefined) announcement.title = title;
    if (message !== undefined) announcement.message = message;
    if (type !== undefined) announcement.type = type;
    if (expiresAt !== undefined) announcement.expiresAt = expiresAt;
    if (isActive !== undefined) announcement.isActive = isActive;
    if (adminNotes !== undefined) announcement.adminNotes = adminNotes;

    await announcement.save();
    res.json(announcement);
  } catch (error) {
    res.status(500).json({
      message: "Error updating announcement",
      error: error.message,
    });
  }
});

// DELETE /api/v1/announcements/:id - Admin delete announcement
router.delete("/:id", async (req, res) => {
  try {
    const adminKey = req.headers["admin-key"];
    if (adminKey !== process.env.ADMIN_KEY || !adminKey) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    console.log(`Announcement "${announcement.title}" deleted by admin`);
    res.json({ message: "Announcement deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting announcement",
      error: error.message,
    });
  }
});

export default router;
