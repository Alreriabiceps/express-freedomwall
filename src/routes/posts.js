import express from "express";
import Post from "../models/Post.js";
import { getRealIP, sanitizeIP } from "../utils/ipUtils.js";
import { getOrCreateSessionId } from "../utils/sessionManager.js";
import {
  postRateLimiter,
  commentRateLimiter,
  likeRateLimiter,
  reportRateLimiter,
  getPostsRateLimiter,
} from "../middleware/rateLimiter.js";
import {
  sessionPostRateLimiter,
  sessionCommentRateLimiter,
} from "../middleware/sessionRateLimiter.js";

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
    const sortBy = req.query.sort || "default";

    let allPosts;

    if (sortBy === "recent") {
      allPosts = await Post.find({
        isHidden: false,
      }).sort({ createdAt: -1 });
    } else {
      const popularPosts = await Post.find({
        isHidden: false,
        engagementScore: { $gte: 5 },
      }).sort({ engagementScore: -1, createdAt: -1 });

      const recentPosts = await Post.find({
        isHidden: false,
        engagementScore: { $lt: 5 },
      }).sort({ createdAt: -1 });

      allPosts = [...popularPosts, ...recentPosts];
    }

    if (userId) {
      allPosts.forEach((post) => {
        try {
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

    const paginatedPosts = allPosts.slice(skip, skip + limit);
    const hasMore = allPosts.length > skip + limit;

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

// Create a new post with enhanced tracking
router.post(
  "/",
  sessionPostRateLimiter, // Use session-based rate limiting
  async (req, res) => {
    try {
      // Get or create session ID
      const sessionId = getOrCreateSessionId(req, res);

      // Get the real IP address
      const realIP = getRealIP(req);
      const sanitizedIP = sanitizeIP(realIP);

      // Get User-Agent
      const userAgent = req.headers["user-agent"] || "unknown";

      // Create post data with all tracking information
      const postData = {
        ...req.body,
        ipAddress: sanitizedIP,
        userAgent: userAgent,
        sessionId: sessionId,
        postedAt: new Date(),
      };

      const post = new Post(postData);
      await post.save();

      // Enhanced logging for moderation
      console.log(`=== NEW POST CREATED ===`);
      console.log(`Time: ${new Date().toISOString()}`);
      console.log(`IP Address: ${sanitizedIP}`);
      console.log(`Session ID: ${sessionId}`);
      console.log(`User-Agent: ${userAgent}`);
      console.log(`Message: ${req.body.message.substring(0, 50)}...`);
      console.log(`========================`);

      // Don't send tracking data in response for security
      const postResponse = post.toObject();
      delete postResponse.ipAddress;
      delete postResponse.userAgent;
      delete postResponse.sessionId;
      delete postResponse.postedAt;

      res.status(201).json(postResponse);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error creating post", error: error.message });
    }
  }
);

// Add a comment to a post with session tracking
router.post(
  "/:id/comment",
  sessionCommentRateLimiter, // Use session-based rate limiting
  async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      // Get session ID for tracking
      const sessionId = getOrCreateSessionId(req, res);

      // Add session ID to comment data
      const commentData = {
        ...req.body,
        sessionId: sessionId,
        postedAt: new Date(),
      };

      post.comments.push(commentData);
      await post.save();

      // Log comment creation
      console.log(
        `Comment added by session: ${sessionId} to post: ${req.params.id}`
      );

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

    const userId = req.body.userId || req.headers["user-id"] || req.ip;

    if (!userId || userId.trim() === "") {
      return res.status(400).json({ message: "Invalid user identifier" });
    }

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

router.post(
  "/:postId/comments/:commentIndex/react",
  commentRateLimiter,
  async (req, res) => {
    try {
      const { postId, commentIndex } = req.params;
      const { reaction, userId } = req.body;

      if (!["thumbsUp", "thumbsDown"].includes(reaction)) {
        return res.status(400).json({
          message: "Invalid reaction type. Must be 'thumbsUp' or 'thumbsDown'",
        });
      }

      if (!userId) {
        return res.status(400).json({ message: "userId is required" });
      }

      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      if (commentIndex < 0 || commentIndex >= post.comments.length) {
        return res.status(404).json({ message: "Comment not found" });
      }

      const comment = post.comments[commentIndex];
      const result = comment.handleReaction(userId, reaction);
      await post.save();

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

// GET /api/v1/posts/admin - Admin endpoint to see all posts with tracking data
router.get("/admin", async (req, res) => {
  try {
    const adminKey = req.headers["admin-key"];
    if (adminKey !== process.env.ADMIN_KEY || !adminKey) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const posts = await Post.find({}).sort({ createdAt: -1 });

    // Include all tracking data for admin view
    const postsWithTracking = posts.map((post) => {
      const postObj = post.toObject();
      return {
        ...postObj,
        ipAddress: postObj.ipAddress || "unknown",
        userAgent: postObj.userAgent || "unknown",
        sessionId: postObj.sessionId || "unknown",
        postedAt: postObj.postedAt || postObj.createdAt,
      };
    });

    res.json(postsWithTracking);
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

    const adminKey = req.headers["admin-key"];
    if (adminKey !== process.env.ADMIN_KEY || !adminKey) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (isHidden !== undefined) post.isHidden = isHidden;
    if (isFlagged !== undefined) post.isFlagged = isFlagged;
    if (adminNotes !== undefined) post.adminNotes = adminNotes;

    await post.save();

    const postWithTracking = post.toObject();
    res.json(postWithTracking);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating post", error: error.message });
  }
});

// DELETE /api/v1/posts/:id/comment/:commentIndex - Admin delete specific comment
router.delete("/:id/comment/:commentIndex", async (req, res) => {
  try {
    const adminKey = req.headers["admin-key"];
    if (adminKey !== process.env.ADMIN_KEY || !adminKey) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id, commentIndex } = req.params;
    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (commentIndex < 0 || commentIndex >= post.comments.length) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const commentToDelete = post.comments[commentIndex];
    const commentText = commentToDelete.message.substring(0, 50);

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

// ===== ENHANCED MODERATION ENDPOINTS =====

// GET /api/v1/posts/admin/ip/:ipAddress - Find posts by IP address
router.get("/admin/ip/:ipAddress", async (req, res) => {
  try {
    const adminKey = req.headers["admin-key"];
    if (adminKey !== process.env.ADMIN_KEY || !adminKey) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { ipAddress } = req.params;

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

    const postsWithTracking = posts.map((post) => {
      const postObj = post.toObject();
      return {
        ...postObj,
        ipAddress: postObj.ipAddress || "unknown",
        userAgent: postObj.userAgent || "unknown",
        sessionId: postObj.sessionId || "unknown",
        postedAt: postObj.postedAt || postObj.createdAt,
      };
    });

    res.json({
      message: `Found ${posts.length} posts from IP: ${ipAddress}`,
      posts: postsWithTracking,
      count: posts.length,
      ipAddress: ipAddress,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error searching posts by IP", error: error.message });
  }
});

// GET /api/v1/posts/admin/session/:sessionId - Find posts by session ID
router.get("/admin/session/:sessionId", async (req, res) => {
  try {
    const adminKey = req.headers["admin-key"];
    if (adminKey !== process.env.ADMIN_KEY || !adminKey) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { sessionId } = req.params;

    const posts = await Post.find({
      sessionId: { $regex: sessionId, $options: "i" },
    }).sort({ createdAt: -1 });

    if (posts.length === 0) {
      return res.json({
        message: `No posts found from session: ${sessionId}`,
        posts: [],
        count: 0,
      });
    }

    const postsWithTracking = posts.map((post) => {
      const postObj = post.toObject();
      return {
        ...postObj,
        ipAddress: postObj.ipAddress || "unknown",
        userAgent: postObj.userAgent || "unknown",
        sessionId: postObj.sessionId || "unknown",
        postedAt: postObj.postedAt || postObj.createdAt,
      };
    });

    res.json({
      message: `Found ${posts.length} posts from session: ${sessionId}`,
      posts: postsWithTracking,
      count: posts.length,
      sessionId: sessionId,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error searching posts by session",
      error: error.message,
    });
  }
});

// GET /api/v1/posts/admin/ip-stats - IP address statistics
router.get("/admin/ip-stats", async (req, res) => {
  try {
    const adminKey = req.headers["admin-key"];
    if (adminKey !== process.env.ADMIN_KEY || !adminKey) {
      return res.status(401).json({ message: "Unauthorized" });
    }

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
          uniqueSessions: { $addToSet: "$sessionId" },
        },
      },
      {
        $addFields: {
          uniqueSessionCount: { $size: "$uniqueSessions" },
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

// GET /api/v1/posts/admin/session-stats - Session statistics
router.get("/admin/session-stats", async (req, res) => {
  try {
    const adminKey = req.headers["admin-key"];
    if (adminKey !== process.env.ADMIN_KEY || !adminKey) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const sessionStats = await Post.aggregate([
      {
        $match: { sessionId: { $exists: true, $ne: null } },
      },
      {
        $group: {
          _id: "$sessionId",
          count: { $sum: 1 },
          lastPost: { $max: "$createdAt" },
          firstPost: { $min: "$createdAt" },
          uniqueIPs: { $addToSet: "$ipAddress" },
        },
      },
      {
        $addFields: {
          uniqueIPCount: { $size: "$uniqueIPs" },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    res.json({
      message: "Session statistics",
      totalUniqueSessions: sessionStats.length,
      sessionStats: sessionStats,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error getting session statistics",
      error: error.message,
    });
  }
});

// GET /api/v1/posts/admin/tracking-summary - Overall tracking summary
router.get("/admin/tracking-summary", async (req, res) => {
  try {
    const adminKey = req.headers["admin-key"];
    if (adminKey !== process.env.ADMIN_KEY || !adminKey) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const summary = await Post.aggregate([
      {
        $facet: {
          totalPosts: [{ $count: "count" }],
          postsWithIP: [
            { $match: { ipAddress: { $exists: true, $ne: null } } },
            { $count: "count" },
          ],
          postsWithSession: [
            { $match: { sessionId: { $exists: true, $ne: null } } },
            { $count: "count" },
          ],
          postsWithUserAgent: [
            { $match: { userAgent: { $exists: true, $ne: null } } },
            { $count: "count" },
          ],
          uniqueIPs: [{ $group: { _id: "$ipAddress" } }, { $count: "count" }],
          uniqueSessions: [
            { $group: { _id: "$sessionId" } },
            { $count: "count" },
          ],
        },
      },
    ]);

    res.json({
      message: "Tracking summary",
      summary: summary[0],
    });
  } catch (error) {
    res.status(500).json({
      message: "Error getting tracking summary",
      error: error.message,
    });
  }
});

export default router;
