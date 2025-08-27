import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    name: { type: String, required: false, default: "Anonymous" },
    message: { type: String, required: true, maxlength: 500 },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const postSchema = new mongoose.Schema(
  {
    name: { type: String, required: false, default: "Anonymous" },
    message: { type: String, required: true, maxlength: 1000 },
    likes: { type: Number, default: 0 },
    likedBy: [{ type: String }], // Array of user identifiers who liked the post
    comments: [commentSchema],
    reportCount: { type: Number, default: 0 },
    isHidden: { type: Boolean, default: false },
    isFlagged: { type: Boolean, default: false },
    engagementScore: { type: Number, default: 0 },
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
