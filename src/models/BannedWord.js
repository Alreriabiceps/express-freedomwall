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
    addedBy: {
      type: String,
      default: "Admin",
    },
  },
  {
    timestamps: true,
  }
);

// Create index for faster word searches
bannedWordSchema.index({ word: 1 });
bannedWordSchema.index({ isActive: 1 });

const BannedWord = mongoose.model("BannedWord", bannedWordSchema);

export default BannedWord;
