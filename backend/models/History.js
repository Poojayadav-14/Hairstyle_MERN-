const mongoose = require("mongoose");

/**
 * History Schema
 * Logs EVERY hairstyle generation request (whether or not the
 * user chooses to save it), useful for a "Recently viewed" feed
 * and for analytics on which preferences are most common.
 *
 * Kept separate from SavedHairstyle because history entries are
 * generated automatically and can grow large / be pruned, while
 * saved hairstyles are explicit user favorites.
 */
const historySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    requestParams: {
      occasion: { type: String, required: true },
      hairType: { type: String, required: true },
      hairLength: { type: String, required: true },
      stylingPreference: { type: String, required: true },
      timeAvailableMinutes: { type: Number, required: true },
    },
    // Snapshot of the raw AI response for that request
    resultSnapshot: {
      totalTimeMinutes: Number,
      steps: [
        {
          stepNumber: Number,
          instruction: String,
          durationMinutes: Number,
          _id: false,
        },
      ],
      tips: [String],
      youtubeSearchQuery: String,
    },
    wasSaved: {
      type: Boolean,
      default: false, // flips to true if user later saves this result
    },
  },
  { timestamps: true }
);

// Auto-expire history older than 90 days (optional housekeeping).
// Comment out if you'd rather keep history forever.
historySchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

module.exports = mongoose.model("History", historySchema);
