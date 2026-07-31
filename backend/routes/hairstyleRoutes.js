const express = require("express");
const router = express.Router();
const {
  generateHairstyle,
  saveHairstyle,
  getSavedHairstyles,
  deleteSavedHairstyle,
  getHistory,
} = require("../controllers/hairstyleController");
const { protect } = require("../middleware/auth");

// All hairstyle routes require the user to be logged in
router.use(protect);

// @route  POST /api/hairstyles/generate
router.post("/generate", generateHairstyle);

// @route  POST /api/hairstyles/save
router.post("/save", saveHairstyle);

// @route  GET /api/hairstyles/saved
router.get("/saved", getSavedHairstyles);

// @route  DELETE /api/hairstyles/saved/:id
router.delete("/saved/:id", deleteSavedHairstyle);

// @route  GET /api/hairstyles/history
router.get("/history", getHistory);

module.exports = router;
