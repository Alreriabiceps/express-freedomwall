import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: false,
      trim: true,
      maxlength: 100,
      default: "Anonymous",
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200, // Updated to match checklist requirement
    },
  },
  {
    timestamps: true,
  }
);

const reportSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  reason: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  reportedAt: {
    type: Date,
    default: Date.now,
  },
});

const postSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: false,
      trim: true,
      maxlength: 100,
      default: "Anonymous",
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000, // Updated to match frontend requirement
    },
    likes: {
      type: Number,
      default: 0,
    },
    likedBy: [
      {
        type: String, // Store IP address or session ID to prevent duplicate likes
        required: true,
      },
    ],
    comments: [commentSchema],
    isFlagged: {
      type: Boolean,
      default: false,
    },
    isHidden: {
      type: Boolean,
      default: false,
    },
    reportCount: {
      type: Number,
      default: 0,
    },
    reports: [reportSchema], // Store detailed report information
    reportedBy: [String], // Keep for backward compatibility
  },
  {
    timestamps: true,
  }
);

// Index for fast latest queries
postSchema.index({ createdAt: -1 });
postSchema.index({ isHidden: 1, createdAt: -1 });

const Post = mongoose.model("Post", postSchema);

export default Post;
