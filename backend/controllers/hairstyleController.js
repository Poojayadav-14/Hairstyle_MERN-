const SavedHairstyle = require("../models/SavedHairstyle");
const History = require("../models/History");
const asyncHandler = require("../utils/asyncHandler");
const { ApiError } = require("../middleware/errorHandler");
const { generateHairstyleInstructions } = require("../services/geminiService");

const VALID_OCCASIONS = ["Wedding", "Party", "Casual", "Office", "Other"];
const VALID_STYLING_PREFS = ["Heatless", "Heat-based"];
const VALID_GENDERS = ["Male", "Female", "Unisex"];

/**
 * Validates and normalizes the incoming request body for a
 * hairstyle generation request. Throws ApiError(400) on failure.
 */
const validatePreferences = (body) => {
  const { occasion, hairType, hairLength, stylingPreference, timeAvailableMinutes, gender } = body;

  if (!occasion || !VALID_OCCASIONS.includes(occasion)) {
    throw new ApiError(400, `occasion must be one of: ${VALID_OCCASIONS.join(", ")}`);
  }
  if (!hairType || typeof hairType !== "string") {
    throw new ApiError(400, "hairType is required (e.g. Straight, Wavy, Curly, Coily)");
  }
  if (!hairLength || typeof hairLength !== "string") {
    throw new ApiError(400, "hairLength is required (e.g. Short, Medium, Long)");
  }
  if (!stylingPreference || !VALID_STYLING_PREFS.includes(stylingPreference)) {
    throw new ApiError(400, `stylingPreference must be one of: ${VALID_STYLING_PREFS.join(", ")}`);
  }
  if (!timeAvailableMinutes || typeof timeAvailableMinutes !== "number" || timeAvailableMinutes <= 0) {
    throw new ApiError(400, "timeAvailableMinutes is required and must be a positive number");
  }
  if (!gender || !VALID_GENDERS.includes(gender)) {
    throw new ApiError(400, `gender must be one of: ${VALID_GENDERS.join(", ")}`);
  }

  return { occasion, hairType, hairLength, stylingPreference, timeAvailableMinutes, gender };
};

/**
 * @desc    Generate a new AI hairstyle tutorial based on user preferences.
 *          Automatically logs the request+result to History.
 * @route   POST /api/hairstyles/generate
 * @access  Private
 */
const generateHairstyle = asyncHandler(async (req, res) => {
  const preferences = validatePreferences(req.body);

  const result = await generateHairstyleInstructions(preferences);

  // Log every generation to History for the user's "recent activity" feed
  const historyEntry = await History.create({
    user: req.user._id,
    requestParams: preferences,
    resultSnapshot: result,
  });

  res.status(200).json({
    success: true,
    data: {
      historyId: historyEntry._id,
      preferences,
      result,
    },
  });
});

/**
 * @desc    Save a previously generated hairstyle result as a favorite
 * @route   POST /api/hairstyles/save
 * @access  Private
 * @body    { title, preferences, result, historyId? }
 */
const saveHairstyle = asyncHandler(async (req, res) => {
  const { title, preferences, result, historyId } = req.body;

  if (!title || !preferences || !result) {
    throw new ApiError(400, "title, preferences, and result are required to save a hairstyle");
  }

  const saved = await SavedHairstyle.create({
    user: req.user._id,
    title,
    preferences,
    result,
  });

  // Optionally mark the originating history entry as saved
  if (historyId) {
    await History.findOneAndUpdate(
      { _id: historyId, user: req.user._id },
      { wasSaved: true }
    );
  }

  res.status(201).json({ success: true, data: saved });
});

/**
 * @desc    Get all saved hairstyles for the logged-in user
 * @route   GET /api/hairstyles/saved
 * @access  Private
 */
const getSavedHairstyles = asyncHandler(async (req, res) => {
  const savedStyles = await SavedHairstyle.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, count: savedStyles.length, data: savedStyles });
});

/**
 * @desc    Delete a saved hairstyle
 * @route   DELETE /api/hairstyles/saved/:id
 * @access  Private
 */
const deleteSavedHairstyle = asyncHandler(async (req, res) => {
  const style = await SavedHairstyle.findOne({ _id: req.params.id, user: req.user._id });

  if (!style) {
    throw new ApiError(404, "Saved hairstyle not found");
  }

  await style.deleteOne();
  res.json({ success: true, message: "Saved hairstyle removed" });
});

/**
 * @desc    Get the logged-in user's generation history (most recent first)
 * @route   GET /api/hairstyles/history
 * @access  Private
 */
const getHistory = asyncHandler(async (req, res) => {
  // Simple pagination support via ?page=&limit=
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;

  const history = await History.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await History.countDocuments({ user: req.user._id });

  res.json({
    success: true,
    count: history.length,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    data: history,
  });
});

module.exports = {
  generateHairstyle,
  saveHairstyle,
  getSavedHairstyles,
  deleteSavedHairstyle,
  getHistory,
};
