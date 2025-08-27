import express from "express";
import Post from "../models/Post.js";
import {
  postRateLimiter,
  commentRateLimiter,
  likeRateLimiter,
  reportRateLimiter,
  getPostsRateLimiter,
} from "../middleware/rateLimiter.js";
import {
  validatePostContent,
  validateCommentContent,
  sanitizeBody,
} from "../middleware/sanitizer.js";

const router = express.Router();

// Get all posts (sorted by engagement score)
router.get("/", getPostsRateLimiter, async (req, res) => {
  try {
    const posts = await Post.find({ isHidden: false }).sort({
      engagementScore: -1,
      createdAt: -1,
    });
    res.json(posts);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching posts", error: error.message });
  }
});

// Create a new post
router.post(
  "/",
  postRateLimiter,
  validatePostContent,
  sanitizeBody,
  async (req, res) => {
    try {
      const post = new Post(req.body);
      await post.save();
      res.status(201).json(post);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error creating post", error: error.message });
    }
  }
);

// Add a comment to a post
router.post(
  "/:id/comment",
  commentRateLimiter,
  validateCommentContent,
  sanitizeBody,
  async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      post.comments.push(req.body);
      await post.save();
      res.json(post);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error adding comment", error: error.message });
    }
  }
);

// Like a post
router.post("/:id/like", likeRateLimiter, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    post.likes += 1;
    await post.save();
    res.json({ likes: post.likes, liked: true });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error liking post", error: error.message });
  }
});

// Report a post
router.post("/:id/report", reportRateLimiter, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    post.reportCount += 1;
    await post.save();
    res.json({ message: "Post reported successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error reporting post", error: error.message });
  }
});

export default router;
