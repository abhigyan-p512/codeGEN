// server/models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    // Editable profile fields
    name: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
    },
    location: {
      type: String,
      default: "",
    },
    githubUrl: {
      type: String,
      default: "",
    },
    linkedinUrl: {
      type: String,
      default: "",
    },
    website: {
      type: String,
      default: "",
    },

    // Ratings / duels
    rating: {
      type: Number,
      default: 1500,
    },
    duelWins: {
      type: Number,
      default: 0,
    },
    duelLosses: {
      type: Number,
      default: 0,
    },

    // 🔥 Team battle stats
    teamBattlesPlayed: {
      type: Number,
      default: 0,
    },
    teamBattlesWon: {
      type: Number,
      default: 0,
    },
    teamBattlesLost: {
      type: Number,
      default: 0,
    },

    // If you already had extra fields, keep them around here
    resetToken: {
      type: String,
      select: false,
    },
    resetExpires: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

module.exports = mongoose.model("User", userSchema);
