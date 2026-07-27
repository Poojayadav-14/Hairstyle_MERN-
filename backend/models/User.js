const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

/**
 * User Schema
 * Stores basic auth + profile info. Passwords are hashed
 * pre-save using bcrypt, never stored in plain text.
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false, // never return password by default in queries
    },
    // Optional profile fields useful for personalizing hairstyle suggestions
    hairType: {
      type: String,
      enum: ["Straight", "Wavy", "Curly", "Coily", "Not specified"],
      default: "Not specified",
    },
    hairLength: {
      type: String,
      enum: ["Short", "Medium", "Long", "Not specified"],
      default: "Not specified",
    },
  },
  { timestamps: true } // adds createdAt & updatedAt automatically
);

// Hash password before saving, only if it was modified
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method to compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
