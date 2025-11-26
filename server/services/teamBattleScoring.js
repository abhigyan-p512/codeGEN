// server/services/teamBattleScoring.js
const TeamBattle = require("../models/TeamBattle");
const User = require("../models/User");

/**
 * Apply scoring for a single Accepted submission in a team battle.
 * You already had something like this – keep it as-is if it works.
 * This file adds a finishTeamBattle helper that bumps per-user stats.
 */

// ... keep your existing handleTeamBattleSubmission logic here ...

/**
 * Mark a battle as finished and update per-user team battle stats.
 * winnerSide: "A" | "B" | "draw"
 */
async function finishTeamBattle(battleId, winnerSide) {
  const battle = await TeamBattle.findById(battleId);
  if (!battle) return;

  if (battle.status === "finished") return;

  battle.status = "finished";
  battle.winner = winnerSide;
  battle.endTime = new Date();
  await battle.save();

  // figure out which users are winners / losers
  const allParticipants = battle.participants || [];
  const winners = [];
  const losers = [];

  if (winnerSide === "draw") {
    // everyone just played a battle, no W/L split
    for (const p of allParticipants) {
      winners.push(p.user); // count as played but not win/loss, we’ll treat below
    }
  } else {
    for (const p of allParticipants) {
      if (p.teamSide === winnerSide) winners.push(p.user);
      else losers.push(p.user);
    }
  }

  const allPlayed = allParticipants.map((p) => p.user);

  const incPlayed = { $inc: { teamBattlesPlayed: 1 } };
  if (allPlayed.length) {
    await User.updateMany({ _id: { $in: allPlayed } }, incPlayed);
  }

  if (winnerSide === "draw") {
    // no explicit win/loss change
    return;
  }

  if (winners.length) {
    await User.updateMany(
      { _id: { $in: winners } },
      { $inc: { teamBattlesWon: 1 } }
    );
  }

  if (losers.length) {
    await User.updateMany(
      { _id: { $in: losers } },
      { $inc: { teamBattlesLost: 1 } }
    );
  }
}

module.exports = {
  // export your existing helpers as well if you have them
  finishTeamBattle,
};
