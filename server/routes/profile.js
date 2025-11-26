// server/routes/profile.js
const express = require("express");
const User = require("../models/User");
const Submission = require("../models/Submission");
const authMiddleware = require("../middleware/authMiddleware");
const { computeRating, getRatingTier } = require("../utils/rating");

const router = express.Router();

// GET /profile/me - get current user info + stats
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // include all profile + game fields we care about
    const user = await User.findById(userId).select(
      "username email name bio location githubUrl linkedinUrl website " +
        "rating duelWins duelLosses teamBattlesPlayed teamBattlesWon teamBattlesLost " +
        "contestsPlayed contestsWon createdAt"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // basic stats from submissions
    const totalSubmissions = await Submission.countDocuments({ user: userId });
    const acceptedSubmissions = await Submission.countDocuments({
      user: userId,
      status: "Accepted",
    });
    const distinctSolvedProblems = await Submission.distinct("problem", {
      user: userId,
      status: "Accepted",
    });

    const totalSolvedProblems = distinctSolvedProblems.length;

    // compute rating from user + stats (same as leaderboard)
    const rating = computeRating({
      totalSolved: totalSolvedProblems,
      totalSubmissions,
      duelWins: user.duelWins || 0,
      duelLosses: user.duelLosses || 0,
      teamBattlesWon: user.teamBattlesWon || 0,
      teamBattlesPlayed: user.teamBattlesPlayed || 0,
      teamBattlesLost: user.teamBattlesLost || 0,
      // if you later store streakLongest somewhere, plug it here
      longestStreak: 0,
    });

    const tier = getRatingTier(rating);

    // keep DB rating in sync
    if (user.rating !== rating) {
      user.rating = rating;
      await user.save();
    }

    res.json({
      user,
      stats: {
        totalSubmissions,
        acceptedSubmissions,
        totalSolvedProblems,
        rating,
        ratingTier: tier.label,
      },
    });
  } catch (err) {
    console.error("Profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
