import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
  {
    penName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    messageType: {
      type: String,
      enum: ["user", "system"],
      default: "user",
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying by timestamp (for message history)
chatMessageSchema.index({ timestamp: -1 });

// Index for pen name lookups
chatMessageSchema.index({ penName: 1 });

export default mongoose.model("ChatMessage", chatMessageSchema);
