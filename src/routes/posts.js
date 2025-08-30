import express from "express";
import Post from "../models/Post.js";
import { getRealIP, sanitizeIP } from "../utils/ipUtils.js";
import {
  postRateLimiter,
  commentRateLimiter,
  likeRateLimiter,
  reportRateLimiter,
  getPostsRateLimiter,
} from "../middleware/rateLimiter.js";
// import {
//   validatePostContent,
//   validateCommentContent,
//   sanitizeBody,
// } from "../middleware/sanitizer.js";

const router = express.Router();

// Test route to verify the API is working
router.get("/test", (req, res) => {
  res.json({
    message: "Posts API is working",
    timestamp: new Date().toISOString(),
  });
});

// Get all posts with sorting options and pagination
router.get("/", getPostsRateLimiter, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const userId = req.query.userId || req.headers["user-id"];
    const sortBy = req.query.sort || "default"; // New: support for sort parameter

    let allPosts;

    if (sortBy === "recent") {
      // Sort purely by creation date (most recent first)
      allPosts = await Post.find({
        isHidden: false,
      }).sort({ createdAt: -1 });
    } else {
      // Default sorting: popular first, then recent
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
      allPosts = [...popularPosts, ...recentPosts];
    }

    // Add user like status to posts if userId is provided
    if (userId) {
      allPosts.forEach((post) => {
        try {
          // Ensure likedBy field exists for existing posts
          if (!post.likedBy) {
            post.likedBy = [];
          }
          post.userLiked = post.hasUserLiked(userId);
        } catch (error) {
          console.error(
            `Error checking like status for post ${post._id}:`,
            error
          );
          post.userLiked = false;
        }
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
  // validatePostContent,
  // sanitizeBody,
  async (req, res) => {
    try {
      // Get the real IP address
      const realIP = getRealIP(req);
      const sanitizedIP = sanitizeIP(realIP);

      // Create post data with IP address
      const postData = {
        ...req.body,
        ipAddress: sanitizedIP,
      };

      const post = new Post(postData);
      await post.save();

      // Log the IP address for moderation purposes
      console.log(`New post created from IP: ${sanitizedIP}`);

      // Don't send IP address in response for security
      const postResponse = post.toObject();
      delete postResponse.ipAddress;

      res.status(201).json(postResponse);
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
  // validateCommentContent,
  // sanitizeBody,
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

// ===== COMMENT REACTIONS =====

// POST /api/v1/posts/:postId/comments/:commentIndex/react - React to a comment
router.post(
  "/:postId/comments/:commentIndex/react",
  commentRateLimiter,
  async (req, res) => {
    try {
      const { postId, commentIndex } = req.params;
      const { reaction, userId } = req.body;

      // Validate reaction type
      if (!["thumbsUp", "thumbsDown"].includes(reaction)) {
        return res.status(400).json({
          message: "Invalid reaction type. Must be 'thumbsUp' or 'thumbsDown'",
        });
      }

      if (!userId) {
        return res.status(400).json({ message: "userId is required" });
      }

      // Find the post
      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      // Check if comment index is valid
      if (commentIndex < 0 || commentIndex >= post.comments.length) {
        return res.status(404).json({ message: "Comment not found" });
      }

      const comment = post.comments[commentIndex];

      // Handle the reaction using the comment method
      const result = comment.handleReaction(userId, reaction);

      // Save the post to persist changes
      await post.save();

      // Return updated comment data
      res.json({
        message: "Reaction updated successfully",
        result,
        comment: {
          thumbsUp: comment.thumbsUp,
          thumbsDown: comment.thumbsDown,
          userReactions: comment.userReactions,
        },
      });
    } catch (error) {
      console.error("Error handling comment reaction:", error);
      res.status(500).json({
        message: "Error updating comment reaction",
        error: error.message,
      });
    }
  }
);

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

    // Include IP addresses for admin view
    const postsWithIP = posts.map((post) => {
      const postObj = post.toObject();
      return {
        ...postObj,
        ipAddress: postObj.ipAddress || "unknown",
      };
    });

    res.json(postsWithIP);
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

    // Return post with IP address for admin view
    const postWithIP = post.toObject();
    res.json(postWithIP);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating post", error: error.message });
  }
});

// DELETE /api/v1/posts/:id/comment/:commentIndex - Admin delete specific comment
router.delete("/:id/comment/:commentIndex", async (req, res) => {
  try {
    // Check admin key from headers
    const adminKey = req.headers["admin-key"];
    if (adminKey !== process.env.ADMIN_KEY || !adminKey) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id, commentIndex } = req.params;
    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if comment index is valid
    if (commentIndex < 0 || commentIndex >= post.comments.length) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Get comment details for logging
    const commentToDelete = post.comments[commentIndex];
    const commentText = commentToDelete.message.substring(0, 50);

    // Remove the comment
    post.comments.splice(commentIndex, 1);
    await post.save();

    console.log(`Comment "${commentText}..." deleted by admin from post ${id}`);
    res.json({
      message: "Comment deleted successfully",
      remainingComments: post.comments.length,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting comment", error: error.message });
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

// GET /api/v1/posts/admin/ip/:ipAddress - Admin endpoint to find posts by IP address
router.get("/admin/ip/:ipAddress", async (req, res) => {
  try {
    // Check admin key from headers
    const adminKey = req.headers["admin-key"];
    if (adminKey !== process.env.ADMIN_KEY || !adminKey) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { ipAddress } = req.params;

    // Find all posts from this IP address
    const posts = await Post.find({
      ipAddress: { $regex: ipAddress, $options: "i" },
    }).sort({ createdAt: -1 });

    if (posts.length === 0) {
      return res.json({
        message: `No posts found from IP: ${ipAddress}`,
        posts: [],
        count: 0,
      });
    }

    // Include IP addresses for admin view
    const postsWithIP = posts.map((post) => {
      const postObj = post.toObject();
      return {
        ...postObj,
        ipAddress: postObj.ipAddress || "unknown",
      };
    });

    res.json({
      message: `Found ${posts.length} posts from IP: ${ipAddress}`,
      posts: postsWithIP,
      count: posts.length,
      ipAddress: ipAddress,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error searching posts by IP", error: error.message });
  }
});

// GET /api/v1/posts/admin/ip-stats - Admin endpoint to get IP address statistics
router.get("/admin/ip-stats", async (req, res) => {
  try {
    // Check admin key from headers
    const adminKey = req.headers["admin-key"];
    if (adminKey !== process.env.ADMIN_KEY || !adminKey) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Aggregate posts by IP address
    const ipStats = await Post.aggregate([
      {
        $match: { ipAddress: { $exists: true, $ne: null } },
      },
      {
        $group: {
          _id: "$ipAddress",
          count: { $sum: 1 },
          lastPost: { $max: "$createdAt" },
          firstPost: { $min: "$createdAt" },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    res.json({
      message: "IP address statistics",
      totalUniqueIPs: ipStats.length,
      ipStats: ipStats,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error getting IP statistics", error: error.message });
  }
});

export default router;
