import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["info", "warning", "success", "error"],
      default: "info",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    priority: {
      type: Number,
      required: false,
      min: 1,
      max: 3,
    },
    expiresAt: {
      type: Date,
      default: null, // null means no expiration
    },
    createdBy: {
      type: String,
      default: "Admin",
    },
    adminNotes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Add index for efficient querying
announcementSchema.index({ isActive: 1, createdAt: -1 });
announcementSchema.index({ expiresAt: 1 });

const Announcement = mongoose.model("Announcement", announcementSchema);

export default Announcement;
