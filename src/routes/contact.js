import express from "express";
import Contact from "../models/Contact.js";
import { contactRateLimiter } from "../middleware/rateLimiter.js";
// import {
//   sanitizeAll,
//   validateContactContent,
// } from "../middleware/sanitizer.js";

const router = express.Router();

// POST /api/v1/contact - Submit contact form
router.post(
  "/",
  // sanitizeAll,
  contactRateLimiter,
  // validateContactContent,
  async (req, res) => {
    try {
      const { name, email, phone, subject, message } = req.body;

      const contact = new Contact({ name, email, phone, subject, message });
      const savedContact = await contact.save();

      console.log(`New contact message from ${name} (${email})`);

      res.status(201).json({
        message: "Message sent successfully",
        contact: savedContact,
      });
    } catch (error) {
      console.error("Error creating contact message:", error);
      res
        .status(500)
        .json({ message: "Error sending message", error: error.message });
    }
  }
);

// GET /api/v1/contact/admin - Admin endpoint to see all contact messages
router.get("/admin", async (req, res) => {
  try {
    // Check admin key from headers
    const adminKey = req.headers["admin-key"];
    if (adminKey !== process.env.ADMIN_KEY || !adminKey) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json(contacts);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching contacts", error: error.message });
  }
});

// PUT /api/v1/contact/:id/status - Admin update contact status
router.put("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, isRead, adminNotes } = req.body;
    const adminKey = req.headers["admin-key"];

    // Simple admin key check
    if (adminKey !== process.env.ADMIN_KEY || !adminKey) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const contact = await Contact.findById(id);
    if (!contact) {
      return res.status(404).json({ message: "Contact message not found" });
    }

    // Update fields
    if (status) contact.status = status;
    if (typeof isRead === "boolean") contact.isRead = isRead;
    if (adminNotes !== undefined) contact.adminNotes = adminNotes;

    await contact.save();

    res.json({
      message: "Contact status updated successfully",
      contact: contact,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating contact", error: error.message });
  }
});

// DELETE /api/v1/contact/:id - Admin delete contact message
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const adminKey = req.headers["admin-key"];

    // Simple admin key check
    if (adminKey !== process.env.ADMIN_KEY || !adminKey) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const contact = await Contact.findByIdAndDelete(id);
    if (!contact) {
      return res.status(404).json({ message: "Contact message not found" });
    }

    console.log(`Contact message from ${contact.name} deleted by admin`);

    res.json({ message: "Contact message deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting contact", error: error.message });
  }
});

export default router;
