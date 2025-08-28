import mongoose from "mongoose";

const optionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  votes: { type: Number, default: 0 },
  voters: [{ type: String }], // Array of userIds who voted for this option
});

const pollSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    options: [optionSchema],
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date },
    totalVotes: { type: Number, default: 0 },
    createdBy: { type: String, default: "Anonymous" }, // userId or "Anonymous"
    topics: [{ type: String }], // Related topics
    engagementScore: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Method to calculate engagement score
pollSchema.methods.calculateEngagementScore = function () {
  return this.totalVotes * 2; // Each vote counts as 2 engagement points
};

// Pre-save middleware to calculate engagement score
pollSchema.pre("save", function (next) {
  this.engagementScore = this.calculateEngagementScore();
  next();
});

// Index for efficient sorting
pollSchema.index({ engagementScore: -1, createdAt: -1 });
pollSchema.index({ isActive: 1, expiresAt: 1 });

const Poll = mongoose.model("Poll", pollSchema);

export default Poll;
