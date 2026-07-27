const express = require("express");
const router = express.Router();
const { registerUser, loginUser, getMyProfile } = require("../controllers/userController");
const { protect } = require("../middleware/auth");

// @route  POST /api/users/register
router.post("/register", registerUser);

// @route  POST /api/users/login
router.post("/login", loginUser);

// @route  GET /api/users/me
router.get("/me", protect, getMyProfile);

module.exports = router;
