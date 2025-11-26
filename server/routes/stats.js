// server/routes/stats.js
const express = require("express");
const User = require("../models/User");

const router = express.Router();

// GET /stats/leaderboard
router.get("/leaderboard", async (req, res) => {
  try {
    const users = await User.find({})
      .select(
        "username rating duelWins duelLosses teamBattlesPlayed teamBattlesWon teamBattlesLost"
      )
      .sort({ rating: -1 })
      .limit(50);

    res.json(users);
  } catch (err) {
    console.error("Leaderboard error:", err);
    res.status(500).json({ message: "Server error loading leaderboard" });
  }
});

module.exports = router;
