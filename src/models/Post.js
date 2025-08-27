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
    likedBy: [{ type: String }], // Array of user identifiers who liked this post
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

// Method to check if user has liked this post
postSchema.methods.hasUserLiked = function (userId) {
  return this.likedBy.includes(userId);
};

// Method to toggle like (like/unlike)
postSchema.methods.toggleLike = function (userId) {
  const hasLiked = this.hasUserLiked(userId);

  if (hasLiked) {
    // Unlike: remove user from likedBy and decrease count
    this.likedBy = this.likedBy.filter((id) => id !== userId);
    this.likes = Math.max(0, this.likes - 1);
    return { liked: false, likes: this.likes };
  } else {
    // Like: add user to likedBy and increase count
    this.likedBy.push(userId);
    this.likes += 1;
    return { liked: true, likes: this.likes };
  }
};

// Pre-save middleware to calculate engagement score
postSchema.pre("save", function (next) {
  this.engagementScore = this.calculateEngagementScore();
  next();
});

// Index for efficient sorting by engagement and date
postSchema.index({ engagementScore: -1, createdAt: -1 });
// Index for efficient like queries
postSchema.index({ likedBy: 1 });

const Post = mongoose.model("Post", postSchema);

export default Post;
