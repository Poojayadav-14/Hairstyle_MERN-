const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const userRoutes = require("./routes/userRoutes");
const hairstyleRoutes = require("./routes/hairstyleRoutes");

// Connect to MongoDB
connectDB();

const app = express();

// --- Core Middleware ---
app.use(
  cors({
    origin: process.env.CLIENT_URL || "*", // React frontend URL
    credentials: true,
  })
);
app.use(express.json()); // parse JSON request bodies
app.use(express.urlencoded({ extended: true }));

// --- Health check ---
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Hairstyle using AI API is running" });
});

// --- Routes ---
app.use("/api/users", userRoutes);
app.use("/api/hairstyles", hairstyleRoutes);

// --- Error Handling (must be last) ---
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
});
