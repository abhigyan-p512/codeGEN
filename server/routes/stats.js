// server/routes/stats.js
const express = require("express");
const router = express.Router();

const User = require("../models/User");
const { computeUserStats } = require("../utils/userStats");
const { computeRating } = require("../utils/rating");

// helper: composite score for leaderboard
function computeLeaderboardScore(user, stats, rating) {
  const totalSolved = stats.totalSolved || 0;
  const accepted = stats.acceptedSubmissions || 0;

  const duelWins = user.duelWins || 0;
  const duelLosses = user.duelLosses || 0;

  const teamBattlesWon = user.teamBattlesWon || 0;
  const teamBattlesLost = user.teamBattlesLost || 0;

  const contestsPlayed = user.contestsPlayed || 0;
  const contestsWon = user.contestsWon || 0;

  const score =
    rating +
    totalSolved * 10 +
    accepted * 2 +
    duelWins * 15 -
    duelLosses * 5 +
    teamBattlesWon * 10 -
    teamBattlesLost * 3 +
    contestsWon * 25 +
    contestsPlayed * 5;

  return Math.round(score);
}

// ---------- GET /stats/leaderboard ----------
router.get("/leaderboard", async (req, res) => {
  try {
    // pull all users (you can filter bots etc. here if needed)
    const users = await User.find().select(
      "username rating duelWins duelLosses teamBattlesPlayed teamBattlesWon teamBattlesLost contestsPlayed contestsWon createdAt"
    );

    const leaderboardEntries = await Promise.all(
      users.map(async (user) => {
        const stats = await computeUserStats(user._id);

        const rating = computeRating({
          totalSolved: stats.totalSolved || 0,
          totalSubmissions: stats.totalSubmissions || 0,
          duelWins: user.duelWins || 0,
          duelLosses: user.duelLosses || 0,
          teamBattlesWon: user.teamBattlesWon || 0,
          teamBattlesPlayed: user.teamBattlesPlayed || 0,
          teamBattlesLost: user.teamBattlesLost || 0,
          // if your computeUserStats includes streakLongest, use it; else 0
          longestStreak: stats.streakLongest || 0,
        });

        const totalScore = computeLeaderboardScore(user, stats, rating);

        // optional: keep stored user.rating synced
        if (user.rating !== rating) {
          user.rating = rating;
          await user.save();
        }

        return {
          _id: user._id,
          username: user.username,

          rating,
          totalScore,

          totalSubmissions: stats.totalSubmissions,
          totalSolved: stats.totalSolved,
          acceptedSubmissions: stats.acceptedSubmissions,
          solvedEasy: stats.solvedEasy,
          solvedMedium: stats.solvedMedium,
          solvedHard: stats.solvedHard,

          duelWins: user.duelWins || 0,
          duelLosses: user.duelLosses || 0,

          teamBattlesPlayed: user.teamBattlesPlayed || 0,
          teamBattlesWon: user.teamBattlesWon || 0,
          teamBattlesLost: user.teamBattlesLost || 0,

          contestsPlayed: user.contestsPlayed || 0,
          contestsWon: user.contestsWon || 0,
        };
      })
    );

    // sort descending by composite score
    leaderboardEntries.sort((a, b) => b.totalScore - a.totalScore);

    // optional: limit to top 100
    res.json(leaderboardEntries.slice(0, 100));
  } catch (err) {
    console.error("GET /stats/leaderboard error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
