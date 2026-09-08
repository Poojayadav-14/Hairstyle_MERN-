const mongoose = require("mongoose");

/**
 * Sub-schema for a single instruction step returned by Gemini.
 * Embedded (not a separate collection) since steps only make
 * sense in the context of their parent hairstyle result.
 */
const stepSchema = new mongoose.Schema(
  {
    stepNumber: { type: Number, required: true },
    instruction: { type: String, required: true },
    durationMinutes: { type: Number, required: true },
  },
  { _id: false }
);

/**
 * SavedHairstyle Schema
 * Represents a hairstyle result the user has explicitly
 * bookmarked/saved for later (favorites).
 */
const savedHairstyleSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    // The inputs that generated this style, stored for reference/regeneration
    preferences: {
      occasion: {
        type: String,
        enum: ["Wedding", "Party", "Casual", "Office", "Other"],
        required: true,
      },
      hairType: { type: String, required: true },
      hairLength: { type: String, required: true },
      stylingPreference: {
        type: String,
        enum: ["Heatless", "Heat-based"],
        required: true,
      },
      timeAvailableMinutes: { type: Number, required: true },
      gender: {
        type: String,
        enum: ["Male", "Female", "Unisex"],
        required: true,
      },
    },
    // The structured AI-generated output
    result: {
      totalTimeMinutes: { type: Number, required: true },
      steps: [stepSchema],
      tips: [{ type: String }],
      youtubeSearchQuery: { type: String, required: true },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SavedHairstyle", savedHairstyleSchema);
