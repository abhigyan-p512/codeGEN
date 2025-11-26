// server/utils/userStats.js
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
  let acceptedSubmissions = 0;

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
      acceptedSubmissions += 1;

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
    acceptedSubmissions,
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

    contestsPlayed: user.contestsPlayed || 0,
    contestsWon: user.contestsWon || 0,

    totalSubmissions: stats.totalSubmissions,
    totalSolved: stats.totalSolved,
    solvedEasy: stats.solvedEasy,
    solvedMedium: stats.solvedMedium,
    solvedHard: stats.solvedHard,
    streakCurrent: stats.streakCurrent,
    streakLongest: stats.streakLongest,
    acceptedSubmissions: stats.acceptedSubmissions,
  };
}

module.exports = {
  computeUserStats,
  mapUserProfile,
};
