// server/utils/rating.js

/**
 * Core rating calculation.
 * Mirrors the logic used on the frontend Profile page.
 */
function computeRating({
  totalSolved = 0,
  totalSubmissions = 0,
  duelWins = 0,
  duelLosses = 0,
  teamBattlesWon = 0,
  teamBattlesPlayed = 0,
  teamBattlesLost = 0,
  longestStreak = 0,
}) {
  const base = 1000;

  const safeTotalSolved = Number(totalSolved) || 0;
  const safeTotalSubmissions = Number(totalSubmissions) || 0;
  const safeDuelWins = Number(duelWins) || 0;
  const safeDuelLosses = Number(duelLosses) || 0;
  const safeTeamBattlesWon = Number(teamBattlesWon) || 0;
  const safeTeamBattlesPlayed = Number(teamBattlesPlayed) || 0;
  const safeTeamBattlesLost = Number(teamBattlesLost) || 0;
  const safeLongestStreak = Number(longestStreak) || 0;

  // acceptance rate in %
  const acceptanceRate =
    safeTotalSubmissions > 0
      ? Math.round((safeTotalSolved / safeTotalSubmissions) * 100)
      : 0;

  // Problems solved – capped so it doesn't explode
  const solvedScore = Math.min(safeTotalSolved, 800) * 3; // max +2400

  // Efficiency (acceptance rate)
  const acceptanceScore = Math.round((acceptanceRate / 100) * 300); // 0–300

  // Duels: wins help more than losses hurt
  const duelScore = safeDuelWins * 35 - safeDuelLosses * 15;

  // Team battles – small influence
  const extraTeamMatches = Math.max(
    safeTeamBattlesPlayed - safeTeamBattlesWon - safeTeamBattlesLost,
    0
  );

  const teamScore =
    safeTeamBattlesWon * 20 +
    extraTeamMatches * 5;

  // Streak – consistency bonus, capped at 60 days
  const streakScore = Math.min(safeLongestStreak, 60) * 8;

  let rating =
    base +
    solvedScore +
    acceptanceScore +
    duelScore +
    teamScore +
    streakScore;

  // Clamp between 800 and 2800
  rating = Math.max(800, Math.min(2800, rating));

  return Math.round(rating);
}

/**
 * Map numeric rating -> tier label (used on UI).
 */
function getRatingTier(rating) {
  const r = Number(rating) || 0;

  if (r < 1000) return { label: "Newbie", color: "#9ca3af" };
  if (r < 1400) return { label: "Bronze", color: "#f97316" };
  if (r < 1700) return { label: "Silver", color: "#e5e7eb" };
  if (r < 2000) return { label: "Gold", color: "#facc15" };
  if (r < 2300) return { label: "Platinum", color: "#38bdf8" };
  return { label: "Legend", color: "#a855f7" };
}

module.exports = {
  computeRating,
  getRatingTier,
};
