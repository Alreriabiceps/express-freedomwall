import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    name: { type: String, required: false, default: "Anonymous" },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    thumbsUp: { type: Number, default: 0 },
    thumbsDown: { type: Number, default: 0 },
    userReactions: [
      {
        userId: { type: String, required: true },
        reaction: {
          type: String,
          enum: ["thumbsUp", "thumbsDown"],
          required: true,
        },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Method to handle comment reactions
commentSchema.methods.handleReaction = function (userId, reaction) {
  try {
    if (!userId) {
      throw new Error("userId is required");
    }

    if (!this.userReactions) {
      this.userReactions = [];
    }

    // Find existing user reaction
    const existingReactionIndex = this.userReactions.findIndex(
      (r) => r.userId === userId
    );
    const existingReaction =
      existingReactionIndex !== -1
        ? this.userReactions[existingReactionIndex]
        : null;

    if (existingReaction) {
      if (existingReaction.reaction === reaction) {
        // User is removing their reaction
        this.userReactions.splice(existingReactionIndex, 1);
        if (reaction === "thumbsUp") {
          this.thumbsUp = Math.max(0, this.thumbsUp - 1);
        } else {
          this.thumbsDown = Math.max(0, this.thumbsDown - 1);
        }
        return { removed: true, reaction: null };
      } else {
        // User is changing their reaction
        this.userReactions.splice(existingReactionIndex, 1);
        // Remove old reaction count
        if (existingReaction.reaction === "thumbsUp") {
          this.thumbsUp = Math.max(0, this.thumbsUp - 1);
        } else {
          this.thumbsDown = Math.max(0, this.thumbsDown - 1);
        }
        // Add new reaction
        this.userReactions.push({ userId, reaction });
        if (reaction === "thumbsUp") {
          this.thumbsUp += 1;
        } else {
          this.thumbsDown += 1;
        }
        return { changed: true, reaction };
      }
    } else {
      // User is adding a new reaction
      this.userReactions.push({ userId, reaction });
      if (reaction === "thumbsUp") {
        this.thumbsUp += 1;
      } else {
        this.thumbsDown += 1;
      }
      return { added: true, reaction };
    }
  } catch (error) {
    console.error(`Error in handleReaction for comment:`, error);
    throw error;
  }
};

// Method to check if user has reacted to comment
commentSchema.methods.hasUserReacted = function (userId) {
  try {
    if (!userId || !this.userReactions) {
      return { thumbsUp: false, thumbsDown: false };
    }

    const userReaction = this.userReactions.find((r) => r.userId === userId);
    if (!userReaction) {
      return { thumbsUp: false, thumbsDown: false };
    }

    return {
      thumbsUp: userReaction.reaction === "thumbsUp",
      thumbsDown: userReaction.reaction === "thumbsDown",
    };
  } catch (error) {
    console.error(`Error in hasUserReacted for comment:`, error);
    return { thumbsUp: false, thumbsDown: false };
  }
};

const postSchema = new mongoose.Schema(
  {
    name: { type: String, required: false, default: "Anonymous" },
    message: { type: String, required: true },
    likes: { type: Number, default: 0 },
    likedBy: [{ type: String }], // Array of user identifiers who liked the post
    comments: [commentSchema],
    reportCount: { type: Number, default: 0 },
    isHidden: { type: Boolean, default: false },
    isFlagged: { type: Boolean, default: false },
    engagementScore: { type: Number, default: 0 },
    ipAddress: { type: String, required: false }, // IP address of the user who created the post
  },
  { timestamps: true }
);

// Method to calculate engagement score
postSchema.methods.calculateEngagementScore = function () {
  const likes = this.likes || 0;
  const comments = this.comments ? this.comments.length : 0;
  return likes + comments * 2;
};

// Method to check if a user has liked the post
postSchema.methods.hasUserLiked = function (userId) {
  try {
    if (!userId || !this.likedBy) {
      return false;
    }
    return this.likedBy.includes(userId);
  } catch (error) {
    console.error(`Error in hasUserLiked for post ${this._id}:`, error);
    return false;
  }
};

// Method to toggle like for a user
postSchema.methods.toggleLike = function (userId) {
  try {
    if (!userId) {
      throw new Error("userId is required");
    }

    if (!this.likedBy) {
      this.likedBy = [];
    }

    const userIndex = this.likedBy.indexOf(userId);

    if (userIndex === -1) {
      // User hasn't liked the post, add like
      this.likedBy.push(userId);
      this.likes = (this.likes || 0) + 1;
      return { likes: this.likes, liked: true };
    } else {
      // User has already liked the post, remove like
      this.likedBy.splice(userIndex, 1);
      this.likes = Math.max(0, (this.likes || 0) - 1);
      return { likes: this.likes, liked: false };
    }
  } catch (error) {
    console.error(`Error in toggleLike for post ${this._id}:`, error);
    throw error;
  }
};

// Pre-save middleware to calculate engagement score
postSchema.pre("save", function (next) {
  this.engagementScore = this.calculateEngagementScore();
  next();
});

// Index for efficient sorting by engagement and date
postSchema.index({ engagementScore: -1, createdAt: -1 });
// Index for efficient queries on likedBy
postSchema.index({ likedBy: 1 });

const Post = mongoose.model("Post", postSchema);

export default Post;
