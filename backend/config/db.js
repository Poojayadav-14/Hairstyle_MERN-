const mongoose = require("mongoose");

/**
 * Connects to MongoDB using the URI defined in .env
 * Exits the process if the connection fails, since the app
 * cannot function without a database connection.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
