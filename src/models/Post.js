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

// Pre-save middleware to calculate engagement score
postSchema.pre("save", function (next) {
  this.engagementScore = this.calculateEngagementScore();
  next();
});

// Index for efficient sorting by engagement and date
postSchema.index({ engagementScore: -1, createdAt: -1 });

const Post = mongoose.model("Post", postSchema);

export default Post;
