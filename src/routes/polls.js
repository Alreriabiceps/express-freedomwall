import express from "express";
import Poll from "../models/Poll.js";
import { getPostsRateLimiter } from "../middleware/rateLimiter.js";
import { sanitizeBody } from "../middleware/sanitizer.js";

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
router.post("/", getPostsRateLimiter, sanitizeBody, async (req, res) => {
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
});

// Vote on a poll
router.post("/:id/vote", getPostsRateLimiter, async (req, res) => {
  try {
    const { optionIndex, userId } = req.body;

    if (optionIndex === undefined || !userId) {
      return res.status(400).json({
        message: "Option index and user ID are required",
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

    if (optionIndex < 0 || optionIndex >= poll.options.length) {
      return res.status(400).json({ message: "Invalid option index" });
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

    // Add vote
    poll.options[optionIndex].votes += 1;
    poll.options[optionIndex].voters.push(userId);
    poll.totalVotes += 1;

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

export default router;
