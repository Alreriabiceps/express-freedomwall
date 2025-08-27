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

// Get all posts (popular first, then recent) with pagination
router.get("/", getPostsRateLimiter, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const userId = req.query.userId || req.headers["user-id"];

    // Get popular posts first (engagement score >= 5)
    const popularPosts = await Post.find({
      isHidden: false,
      engagementScore: { $gte: 5 },
    }).sort({ engagementScore: -1, createdAt: -1 });

    // Get recent posts (engagement score < 5)
    const recentPosts = await Post.find({
      isHidden: false,
      engagementScore: { $lt: 5 },
    }).sort({ createdAt: -1 });

    // Combine: popular posts first, then recent posts
    const allPosts = [...popularPosts, ...recentPosts];

    // Add user like status to posts if userId is provided
    if (userId) {
      allPosts.forEach((post) => {
        post.userLiked = post.hasUserLiked(userId);
      });
    }

    // Apply pagination
    const paginatedPosts = allPosts.slice(skip, skip + limit);

    // Check if there are more posts
    const hasMore = allPosts.length > skip + limit;

    // Always return the new paginated format
    res.json({
      posts: paginatedPosts,
      currentPage: page,
      totalPages: Math.ceil(allPosts.length / limit),
      hasMore,
      totalPosts: allPosts.length,
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
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

// Like/Unlike a post (toggle)
router.post("/:id/like", likeRateLimiter, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Get user identifier from request body or headers
    const userId = req.body.userId || req.headers["user-id"] || req.ip;

    // Additional validation: ensure userId is not empty
    if (!userId || userId.trim() === "") {
      return res.status(400).json({ message: "Invalid user identifier" });
    }

    // Use the toggleLike method to handle like/unlike
    const result = post.toggleLike(userId);
    await post.save();

    res.json({
      likes: result.likes,
      liked: result.liked,
      message: result.liked
        ? "Post liked successfully"
        : "Post unliked successfully",
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error toggling like", error: error.message });
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

// ===== ADMIN ROUTES =====

// GET /api/v1/posts/admin - Admin endpoint to see all posts (including hidden)
router.get("/admin", async (req, res) => {
  try {
    // Check admin key from headers
    const adminKey = req.headers["admin-key"];
    if (adminKey !== process.env.ADMIN_KEY || !adminKey) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const posts = await Post.find({}).sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching posts", error: error.message });
  }
});

// PUT /api/v1/posts/:id/status - Admin update post status
router.put("/:id/status", async (req, res) => {
  try {
    const { isHidden, isFlagged, adminNotes } = req.body;

    // Check admin key from headers
    const adminKey = req.headers["admin-key"];
    if (adminKey !== process.env.ADMIN_KEY || !adminKey) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Update post status
    if (isHidden !== undefined) post.isHidden = isHidden;
    if (isFlagged !== undefined) post.isFlagged = isFlagged;
    if (adminNotes !== undefined) post.adminNotes = adminNotes;

    await post.save();
    res.json(post);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating post", error: error.message });
  }
});

// DELETE /api/v1/posts/:id - Admin delete post
router.delete("/:id", async (req, res) => {
  try {
    // Check admin key from headers
    const adminKey = req.headers["admin-key"];
    if (adminKey !== process.env.ADMIN_KEY || !adminKey) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    console.log(`Post "${post.message.substring(0, 50)}..." deleted by admin`);
    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting post", error: error.message });
  }
});

export default router;
