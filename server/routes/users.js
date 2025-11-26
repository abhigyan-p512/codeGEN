// server/routes/users.js
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User");
const Submission = require("../models/Submission");

// ---------- Helper: compute per-user stats ----------
async function computeUserStats(userId) {
  // 🔥 IMPORTANT: filter by userId
  const submissions = await Submission.find({ user: userId })
    .sort({ createdAt: 1 })
    .populate("problem", "difficulty");

  const totalSubmissions = submissions.length;

  const difficultyStats = { Easy: 0, Medium: 0, Hard: 0 };
  const languageStats = {};
  const solvedProblemMap = new Map();
  const solvedDates = new Set(); // YYYY-MM-DD with at least one AC

  const now = new Date();
  const yearAgo = new Date(now);
  yearAgo.setDate(yearAgo.getDate() - 365);

  const dailySubmissions = {}; // { "YYYY-MM-DD": count }

  for (const sub of submissions) {
    const lang = sub.language || sub.lang;
    if (lang) {
      languageStats[lang] = (languageStats[lang] || 0) + 1;
    }

    // Accepted submissions → solved counts + streak dates
    if (sub.status === "Accepted" && sub.problem) {
      const pid = String(sub.problem._id);
      const diff = sub.problem.difficulty || "Easy";

      if (!solvedProblemMap.has(pid)) {
        solvedProblemMap.set(pid, diff);
        difficultyStats[diff] = (difficultyStats[diff] || 0) + 1;
      }

      if (sub.createdAt) {
        const d = sub.createdAt.toISOString().substring(0, 10);
        solvedDates.add(d);
      }
    }

    // all submissions counted in activity (past year)
    if (sub.createdAt && sub.createdAt >= yearAgo) {
      const d = sub.createdAt.toISOString().substring(0, 10);
      dailySubmissions[d] = (dailySubmissions[d] || 0) + 1;
    }
  }

  const solvedEasy = difficultyStats.Easy || 0;
  const solvedMedium = difficultyStats.Medium || 0;
  const solvedHard = difficultyStats.Hard || 0;
  const totalSolved = solvedEasy + solvedMedium + solvedHard;

  // ---------- streaks (from Accepted days) ----------
  let streakCurrent = 0;
  let streakLongest = 0;

  const dates = Array.from(solvedDates).sort();
  if (dates.length > 0) {
    const toDate = (s) => new Date(s + "T00:00:00Z");

    // longest
    let run = 1;
    streakLongest = 1;
    for (let i = 1; i < dates.length; i++) {
      const prev = toDate(dates[i - 1]);
      const curr = toDate(dates[i]);
      const diffDays =
        (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays === 1) run++;
      else run = 1;
      if (run > streakLongest) streakLongest = run;
    }

    // current (ending at latest accepted day)
    streakCurrent = 1;
    for (let i = dates.length - 1; i > 0; i--) {
      const curr = toDate(dates[i]);
      const prev = toDate(dates[i - 1]);
      const diffDays =
        (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays === 1) streakCurrent++;
      else break;
    }
  }

  // ---------- activity array ----------
  const activityByDate = Object.entries(dailySubmissions)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  const submissionsPastYear = activityByDate.reduce(
    (sum, d) => sum + d.count,
    0
  );
  const activeDaysPastYear = activityByDate.length;

  const recentSubmissions = submissions
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 20);

  return {
    totalSubmissions,
    totalSolved,
    solvedEasy,
    solvedMedium,
    solvedHard,
    difficultyStats,
    languageStats,
    streakCurrent,
    streakLongest,
    activityByDate,
    submissionsPastYear,
    activeDaysPastYear,
    recentSubmissions,
  };
}

// ---------- Helper: map user + stats to profile ----------
function mapUserProfile(user, stats) {
  return {
    _id: user._id,
    username: user.username,
    email: user.email,
    createdAt: user.createdAt,

    name: user.name || "",
    bio: user.bio || "",
    location: user.location || "",
    githubUrl: user.githubUrl || "",
    linkedinUrl: user.linkedinUrl || "",
    website: user.website || "",

    rating: user.rating || 1500,

    // duel + team battle counters are PER USER here
    duelWins: user.duelWins || 0,
    duelLosses: user.duelLosses || 0,
    teamBattlesPlayed: user.teamBattlesPlayed || 0,
    teamBattlesWon: user.teamBattlesWon || 0,
    teamBattlesLost: user.teamBattlesLost || 0,

    totalSubmissions: stats.totalSubmissions,
    totalSolved: stats.totalSolved,
    solvedEasy: stats.solvedEasy,
    solvedMedium: stats.solvedMedium,
    solvedHard: stats.solvedHard,
    streakCurrent: stats.streakCurrent,
    streakLongest: stats.streakLongest,
  };
}

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
        "rating duelWins duelLosses teamBattlesPlayed teamBattlesWon teamBattlesLost"
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

      rating: user?.rating ?? 1500,
      duelWins: user?.duelWins ?? 0,
      duelLosses: user?.duelLosses ?? 0,
      teamBattlesPlayed: user?.teamBattlesPlayed ?? 0,
      teamBattlesWon: user?.teamBattlesWon ?? 0,
      teamBattlesLost: user?.teamBattlesLost ?? 0,
    });
  } catch (err) {
    console.error("GET /users/me/stats error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
