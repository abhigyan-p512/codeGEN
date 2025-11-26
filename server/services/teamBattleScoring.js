// server/services/teamBattleScoring.js
const TeamBattle = require("../models/TeamBattle");
const Problem = require("../models/Problem");

// base points based on problem difficulty
function getBasePoints(difficulty) {
  if (difficulty === "Easy") return 100;
  if (difficulty === "Medium") return 200;
  return 300; // Hard/default
}

/**
 * Handles a submission that belongs to a team battle.
 *
 * params: { battleId, userId, problemId, verdict, submittedAt }
 * returns: updated battle (or null if something went wrong / no update)
 */
async function handleTeamBattleSubmission({
  battleId,
  userId,
  problemId,
  verdict,
  submittedAt,
}) {
  const battle = await TeamBattle.findById(battleId);
  if (!battle || battle.status !== "ongoing") return null;

  const participant = battle.participants.find(
    (p) => p.user.toString() === userId.toString()
  );
  if (!participant) return null;

  const teamKey = participant.teamSide === "A" ? "teamA" : "teamB";
  const team = battle[teamKey];

  // find or create perUserProblem entry
  let upp = battle.perUserProblem.find(
    (x) =>
      x.user.toString() === userId.toString() &&
      x.problem.toString() === problemId.toString()
  );
  if (!upp) {
    upp = {
      user: userId,
      problem: problemId,
      solved: false,
      wrongAttempts: 0,
    };
    battle.perUserProblem.push(upp);
  }

  // if already solved by this user, ignore further submissions
  if (upp.solved) {
    await battle.save();
    return battle;
  }

  if (verdict === "AC") {
    upp.solved = true;

    const problem = await Problem.findById(problemId);
    const difficulty = problem?.difficulty || "Medium";

    const base = getBasePoints(difficulty);

    const startTime = battle.startTime || new Date();
    const submittedTime = submittedAt || new Date();
    const timeTakenSeconds = Math.max(
      0,
      Math.floor(
        (submittedTime.getTime() - startTime.getTime()) / 1000
      )
    );

    const timePenalty = Math.floor(timeTakenSeconds / 60); // 1 pt / minute
    const wrongPenalty = upp.wrongAttempts * 10;

    const gained = Math.max(0, base - timePenalty - wrongPenalty);

    // update participant
    participant.score += gained;
    participant.solved += 1;
    participant.totalTimeSeconds += timeTakenSeconds;

    // update team aggregates
    team.score += gained;
    team.solved += 1;
    team.totalTimeSeconds += timeTakenSeconds;
  } else {
    // WA/TLE/RE etc.
    upp.wrongAttempts += 1;
  }

  await battle.save();
  return battle;
}

/**
 * Marks a battle as finished and decides the winner using:
 * 1. higher team score
 * 2. if tie, lower totalTimeSeconds wins
 */
async function finishTeamBattle(battleId) {
  const battle = await TeamBattle.findById(battleId);
  if (!battle || battle.status === "finished") return battle;

  battle.status = "finished";
  battle.endTime = new Date();

  const { teamA, teamB } = battle;

  if (teamA.score > teamB.score) battle.winner = "A";
  else if (teamB.score > teamA.score) battle.winner = "B";
  else {
    if (teamA.totalTimeSeconds < teamB.totalTimeSeconds) battle.winner = "A";
    else if (teamB.totalTimeSeconds < teamA.totalTimeSeconds)
      battle.winner = "B";
    else battle.winner = "draw";
  }

  await battle.save();
  return battle;
}

module.exports = {
  handleTeamBattleSubmission,
  finishTeamBattle,
};
