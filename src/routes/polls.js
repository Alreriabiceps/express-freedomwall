import express from "express";
import Poll from "../models/Poll.js";
import { requireAdminAuth } from "../middleware/adminAuth.js";
import { getPostsRateLimiter } from "../middleware/rateLimiter.js";
// import { sanitizeBody } from "../middleware/sanitizer.js";

const router = express.Router();

// Get all active polls
router.get("/", getPostsRateLimiter, async (req, res) => {
  try {
    const polls = await Poll.find({ isActive: true }).sort({
      engagementScore: -1,
      createdAt: -1,
    });
    res.json(polls);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching polls", error: error.message });
  }
});

// Get trending polls
router.get("/trending", getPostsRateLimiter, async (req, res) => {
  try {
    const trendingPolls = await Poll.find({ isActive: true })
      .sort({ engagementScore: -1 })
      .limit(5);
    res.json(trendingPolls);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching trending polls", error: error.message });
  }
});

// Create a new poll
router.post(
  "/",
  getPostsRateLimiter,
  /* sanitizeBody, */ async (req, res) => {
    try {
      const { question, options, expiresAt, topics } = req.body;

      if (!question || !options || options.length < 2) {
        return res.status(400).json({
          message: "Question and at least 2 options are required",
        });
      }

      if (options.length > 6) {
        return res.status(400).json({
          message: "Maximum 6 options allowed",
        });
      }

      const poll = new Poll({
        question,
        options: options.map((option) => ({ text: option })),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        topics: topics || [],
        createdBy: req.body.name || "Anonymous",
      });

      await poll.save();
      res.status(201).json(poll);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error creating poll", error: error.message });
    }
  }
);

// Vote on a poll
router.post("/:id/vote", getPostsRateLimiter, async (req, res) => {
  try {
    const { optionIndices, userId } = req.body;

    if (
      !optionIndices ||
      !Array.isArray(optionIndices) ||
      optionIndices.length === 0 ||
      !userId
    ) {
      return res.status(400).json({
        message: "Option indices array and user ID are required",
      });
    }

    const poll = await Poll.findById(req.params.id);
    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    if (!poll.isActive) {
      return res.status(400).json({ message: "Poll is no longer active" });
    }

    if (poll.expiresAt && new Date() > poll.expiresAt) {
      return res.status(400).json({ message: "Poll has expired" });
    }

    // Validate all option indices
    for (const index of optionIndices) {
      if (index < 0 || index >= poll.options.length) {
        return res.status(400).json({ message: "Invalid option index" });
      }
    }

    // Check if user already voted
    const hasVoted = poll.options.some((option) =>
      option.voters.includes(userId)
    );

    if (hasVoted) {
      return res
        .status(400)
        .json({ message: "You have already voted on this poll" });
    }

    // Add votes for all selected options
    for (const index of optionIndices) {
      poll.options[index].votes += 1;
      poll.options[index].voters.push(userId);
    }
    poll.totalVotes += optionIndices.length;

    await poll.save();
    res.json(poll);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error voting on poll", error: error.message });
  }
});

// Get poll results
router.get("/:id/results", getPostsRateLimiter, async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    // Calculate percentages
    const results = poll.options.map((option) => ({
      text: option.text,
      votes: option.votes,
      percentage:
        poll.totalVotes > 0
          ? Math.round((option.votes / poll.totalVotes) * 100)
          : 0,
    }));

    res.json({
      question: poll.question,
      totalVotes: poll.totalVotes,
      results,
      isActive: poll.isActive,
      expiresAt: poll.expiresAt,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching poll results", error: error.message });
  }
});

// ===== ADMIN ROUTES =====

// GET /api/v1/polls/admin - Admin endpoint to see all polls (including inactive)
router.get("/admin", requireAdminAuth, async (req, res) => {
  try {
    // Check admin key from headers

    const polls = await Poll.find({}).sort({ createdAt: -1 });
    res.json(polls);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching polls", error: error.message });
  }
});

// PUT /api/v1/polls/:id/status - Admin update poll status
router.put("/:id/status", requireAdminAuth, async (req, res) => {
  try {
    const { isActive, adminNotes } = req.body;

    // Check admin key from headers

    const poll = await Poll.findById(req.params.id);
    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    // Update poll status
    if (isActive !== undefined) poll.isActive = isActive;
    if (adminNotes !== undefined) poll.adminNotes = adminNotes;

    await poll.save();
    res.json(poll);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating poll", error: error.message });
  }
});

// DELETE /api/v1/polls/:id - Admin delete poll
router.delete("/:id", requireAdminAuth, async (req, res) => {
  try {
    // Check admin key from headers

    const poll = await Poll.findByIdAndDelete(req.params.id);
    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    console.log(`Poll "${poll.question.substring(0, 50)}..." deleted by admin`);
    res.json({ message: "Poll deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting poll", error: error.message });
  }
});

export default router;
