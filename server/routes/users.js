// server/routes/users.js
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User");
const { computeUserStats, mapUserProfile } = require("../utils/userStats");

// ---------- GET /users/me ----------
router.get("/me", authMiddleware, async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(req.user.id).select(
      "-passwordHash -resetToken -resetExpires -__v"
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const stats = await computeUserStats(user._id);
    return res.json(mapUserProfile(user, stats));
  } catch (err) {
    console.error("GET /users/me error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ---------- PUT /users/me (edit profile) ----------
router.put("/me", authMiddleware, async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { name, bio, location, githubUrl, linkedinUrl, website } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (bio !== undefined) updates.bio = bio;
    if (location !== undefined) updates.location = location;
    if (githubUrl !== undefined) updates.githubUrl = githubUrl;
    if (linkedinUrl !== undefined) updates.linkedinUrl = linkedinUrl;
    if (website !== undefined) updates.website = website;

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
    }).select("-passwordHash -resetToken -resetExpires -__v");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const stats = await computeUserStats(user._id);
    return res.json(mapUserProfile(user, stats));
  } catch (err) {
    console.error("PUT /users/me error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ---------- GET /users/me/stats ----------
router.get("/me/stats", authMiddleware, async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const [stats, user] = await Promise.all([
      computeUserStats(req.user.id),
      User.findById(req.user.id).select(
        "rating duelWins duelLosses teamBattlesPlayed teamBattlesWon teamBattlesLost contestsPlayed contestsWon"
      ),
    ]);

    return res.json({
      difficultyStats: stats.difficultyStats,
      languageStats: stats.languageStats,
      totalSolved: stats.totalSolved,
      totalSubmissions: stats.totalSubmissions,
      solvedEasy: stats.solvedEasy,
      solvedMedium: stats.solvedMedium,
      solvedHard: stats.solvedHard,
      streakCurrent: stats.streakCurrent,
      streakLongest: stats.streakLongest,
      activityByDate: stats.activityByDate,
      submissionsPastYear: stats.submissionsPastYear,
      activeDaysPastYear: stats.activeDaysPastYear,
      recent: stats.recentSubmissions,

      acceptedSubmissions: stats.acceptedSubmissions,

      rating: user?.rating ?? 1500,
      duelWins: user?.duelWins ?? 0,
      duelLosses: user?.duelLosses ?? 0,
      teamBattlesPlayed: user?.teamBattlesPlayed ?? 0,
      teamBattlesWon: user?.teamBattlesWon ?? 0,
      teamBattlesLost: user?.teamBattlesLost ?? 0,
      contestsPlayed: user?.contestsPlayed ?? 0,
      contestsWon: user?.contestsWon ?? 0,
    });
  } catch (err) {
    console.error("GET /users/me/stats error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
