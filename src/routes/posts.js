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
  sanitizeAll,
  validatePostContent,
  validateCommentContent,
} from "../middleware/sanitizer.js";

const router = express.Router();

// GET /api/v1/posts - List all posts (latest first, excluding hidden posts)
router.get("/", getPostsRateLimiter, async (req, res) => {
  try {
    const posts = await Post.find({ isHidden: false }).sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching posts", error: error.message });
  }
});

// GET /api/v1/posts/admin - Admin endpoint to see all posts including hidden ones
router.get("/admin", async (req, res) => {
  try {
    // Check admin key from headers
    const adminKey = req.headers["admin-key"];
    if (adminKey !== process.env.ADMIN_KEY || !adminKey) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching posts", error: error.message });
  }
});

// POST /api/v1/posts - Create a new post
router.post(
  "/",
  sanitizeAll,
  postRateLimiter,
  validatePostContent,
  async (req, res) => {
    try {
      const { name, message } = req.body;

      const post = new Post({ name, message });
      const savedPost = await post.save();

      res.status(201).json(savedPost);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error creating post", error: error.message });
    }
  }
);

// POST /api/v1/posts/:id/like - Like a post
router.post("/:id/like", sanitizeAll, likeRateLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User identifier is required" });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.isHidden) {
      return res.status(400).json({ message: "Cannot like hidden posts" });
    }

    // Extract device ID from userId (format: user_<deviceId>_<sessionId>)
    const deviceId = userId.split("_")[1];

    // Check if this device has already liked the post
    const alreadyLiked = post.likedBy.includes(userId);

    // Additional check: prevent multiple likes from same device
    const deviceAlreadyLiked = post.likedBy.some((id) => id.includes(deviceId));

    if (alreadyLiked) {
      // Unlike the post
      post.likes = Math.max(0, post.likes - 1);
      post.likedBy = post.likedBy.filter((id) => id !== userId);
    } else if (deviceAlreadyLiked) {
      // Device already liked this post, return error
      return res.status(400).json({
        message: "This device has already liked this post",
        error: "DEVICE_ALREADY_LIKED",
      });
    } else {
      // Like the post
      post.likes += 1;
      post.likedBy.push(userId);
    }

    await post.save();

    res.json({
      likes: post.likes,
      liked: !alreadyLiked,
      message: alreadyLiked ? "Post unliked" : "Post liked",
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating like", error: error.message });
  }
});

// POST /api/v1/posts/:id/comment - Add a comment to a post
router.post(
  "/:id/comment",
  sanitizeAll,
  commentRateLimiter,
  validateCommentContent,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, message } = req.body;

      const post = await Post.findById(id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      if (post.isHidden) {
        return res
          .status(400)
          .json({ message: "Cannot comment on hidden posts" });
      }

      post.comments.push({ name, message });
      await post.save();

      res.status(201).json(post);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error adding comment", error: error.message });
    }
  }
);

// POST /api/v1/posts/:id/report - Report a post
router.post("/:id/report", sanitizeAll, reportRateLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, reason } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User identifier is required" });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: "Report reason is required" });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if user already reported this post
    if (post.reportedBy.includes(userId)) {
      return res
        .status(400)
        .json({ message: "You have already reported this post" });
    }

    // Add report with detailed information
    post.reports.push({
      userId,
      reason: reason.trim(),
      reportedAt: new Date(),
    });

    // Keep backward compatibility
    post.reportedBy.push(userId);
    post.reportCount += 1;

    // Flag post if it gets multiple reports
    if (post.reportCount >= 3) {
      post.isFlagged = true;
    }

    await post.save();

    res.json({
      message: "Post reported successfully",
      reportCount: post.reportCount,
      isFlagged: post.isFlagged,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error reporting post", error: error.message });
  }
});

// POST /api/v1/posts/:id/moderate - Admin moderation actions
router.post("/:id/moderate", sanitizeAll, async (req, res) => {
  try {
    const { id } = req.params;
    const { action, adminKey } = req.body;

    // Simple admin key check (in production, use proper authentication)
    if (adminKey !== process.env.ADMIN_KEY || !adminKey) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    switch (action) {
      case "hide":
        post.isHidden = true;
        break;
      case "unhide":
        post.isHidden = false;
        break;
      case "unflag":
        post.isFlagged = false;
        post.reportCount = 0;
        post.reportedBy = [];
        break;
      case "delete":
        await Post.findByIdAndDelete(id);
        return res.json({ message: "Post deleted successfully" });
      default:
        return res.status(400).json({ message: "Invalid action" });
    }

    await post.save();

    res.json({
      message: `Post ${action}ed successfully`,
      post: post,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error moderating post", error: error.message });
  }
});

// DELETE /api/v1/posts/:id/comment/:commentIndex - Admin delete comment
router.delete("/:id/comment/:commentIndex", async (req, res) => {
  try {
    const { id, commentIndex } = req.params;
    const adminKey = req.headers["admin-key"];

    // Simple admin key check
    if (adminKey !== process.env.ADMIN_KEY || !adminKey) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const index = parseInt(commentIndex);
    if (index < 0 || index >= post.comments.length) {
      return res.status(400).json({ message: "Invalid comment index" });
    }

    // Remove the comment at the specified index
    post.comments.splice(index, 1);
    await post.save();

    res.json({
      message: "Comment deleted successfully",
      post: post,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting comment", error: error.message });
  }
});

export default router;
