import mongoose from "mongoose";

const bannedWordSchema = new mongoose.Schema(
  {
    word: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    reason: {
      type: String,
      trim: true,
    },
    addedBy: {
      type: String,
      default: "admin",
    },
  },
  {
    timestamps: true,
  }
);

// Create index for faster word lookups
bannedWordSchema.index({ word: 1 });
bannedWordSchema.index({ isActive: 1 });

const BannedWord = mongoose.model("BannedWord", bannedWordSchema);

export default BannedWord;
