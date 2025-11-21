// server/routes/users.js
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User");
const Submission = require("../models/Submission");
const Problem = require("../models/Problem");

// Helper: compute stats + streaks + daily activity for a user
async function computeUserStats(userId) {
  // Oldest -> newest for streak calculation
  const submissions = await Submission.find({ user: userId })
    .sort({ createdAt: 1 })
    .populate("problem", "title difficulty");

  const totalSubmissions = submissions.length;

  const difficultyStats = { Easy: 0, Medium: 0, Hard: 0 };
  const languageStats = {};
  const solvedProblemMap = new Map();

  // For streaks we track days with Accepted submissions
  const solvedDates = new Set(); // YYYY-MM-DD for accepted subs

  // For activity heatmap we track ALL submissions per day (past year)
  const now = new Date();
  const startYear = new Date(now);
  startYear.setDate(startYear.getDate() - 365);

  const dailySubmissions = {}; // { 'YYYY-MM-DD': count }

  for (const sub of submissions) {
    const lang = sub.language || sub.lang;
    if (lang) {
      languageStats[lang] = (languageStats[lang] || 0) + 1;
    }

    // difficulty / solved stats from Accepted submissions
    if (sub.status === "Accepted" && sub.problem) {
      const pid = String(sub.problem._id);
      const diff = sub.problem.difficulty || "Easy";

      if (!solvedProblemMap.has(pid)) {
        solvedProblemMap.set(pid, diff);
        difficultyStats[diff] = (difficultyStats[diff] || 0) + 1;
      }

      if (sub.createdAt) {
        const dateKey = sub.createdAt.toISOString().substring(0, 10);
        solvedDates.add(dateKey);
      }
    }

    // daily submission counts for last year (all statuses)
    if (sub.createdAt && sub.createdAt >= startYear) {
      const dateKey = sub.createdAt.toISOString().substring(0, 10);
      dailySubmissions[dateKey] = (dailySubmissions[dateKey] || 0) + 1;
    }
  }

  const solvedEasy = difficultyStats.Easy || 0;
  const solvedMedium = difficultyStats.Medium || 0;
  const solvedHard = difficultyStats.Hard || 0;
  const totalSolved = solvedEasy + solvedMedium + solvedHard;

  // ---- streaks (based on Accepted days) ----
  let streakCurrent = 0;
  let streakLongest = 0;

  const dates = Array.from(solvedDates).sort(); // ascending

  if (dates.length > 0) {
    const toDateObj = (d) => new Date(d + "T00:00:00Z");

    // longest streak overall
    let run = 1;
    streakLongest = 1;
    for (let i = 1; i < dates.length; i++) {
      const prev = toDateObj(dates[i - 1]);
      const curr = toDateObj(dates[i]);
      const diffDays = Math.round(
        (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays === 1) {
        run++;
      } else {
        run = 1;
      }
      if (run > streakLongest) streakLongest = run;
    }

    // current streak (ending at latest active Accepted day)
    streakCurrent = 1;
    for (let i = dates.length - 1; i > 0; i--) {
      const curr = toDateObj(dates[i]);
      const prev = toDateObj(dates[i - 1]);
      const diffDays = Math.round(
        (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays === 1) {
        streakCurrent++;
      } else {
        break;
      }
    }
  }

  // ---- daily activity array for the last year ----
  const activityByDate = Object.entries(dailySubmissions)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  const submissionsPastYear = activityByDate.reduce(
    (sum, day) => sum + day.count,
    0
  );
  const activeDaysPastYear = activityByDate.length;

  // recent submissions (newest first, limit 20) – not used on UI now, but handy
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

// Helper: map a user + stats to profile JSON
function mapUserProfile(user, stats) {
  return {
    _id: user._id,
    username: user.username,
    email: user.email,
    createdAt: user.createdAt,

    // editable profile fields
    name: user.name || "",
    bio: user.bio || "",
    location: user.location || "",
    githubUrl: user.githubUrl || "",
    linkedinUrl: user.linkedinUrl || "",
    website: user.website || "",

    // rating / duels
    rating: user.rating || 1500,
    duelWins: user.duelWins || 0,
    duelLosses: user.duelLosses || 0,

    // stats snapshot for profile card
    totalSubmissions: stats.totalSubmissions,
    totalSolved: stats.totalSolved,
    solvedEasy: stats.solvedEasy,
    solvedMedium: stats.solvedMedium,
    solvedHard: stats.solvedHard,
    streakCurrent: stats.streakCurrent,
    streakLongest: stats.streakLongest,
  };
}

// GET /users/me - profile + aggregated stats
router.get("/me", authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(req.user.id).select(
      "-password -__v -resetToken -resetExpires"
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

// PUT /users/me - edit profile (name, bio, location, links)
router.put("/me", authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
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
    }).select("-password -__v -resetToken -resetExpires");

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

// GET /users/me/stats - stats + streaks + daily activity
router.get("/me/stats", authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const stats = await computeUserStats(req.user.id);

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
    });
  } catch (err) {
    console.error("GET /users/me/stats error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// (Optional legacy route)
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(req.user.id).select(
      "-password -__v -resetToken -resetExpires"
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json({
      id: user._id,
      name: user.name || user.username,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl || null,
      bio: user.bio || "",
      joinedAt: user.createdAt,
    });
  } catch (err) {
    console.error("GET /users/profile error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
