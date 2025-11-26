// server/routes/teamBattles.js
const express = require("express");
const auth = require("../middleware/authMiddleware");
const Team = require("../models/Team");
const Problem = require("../models/Problem");
const TeamBattle = require("../models/TeamBattle");

const router = express.Router();

/**
 * Create a new team battle
 * POST /team-battles
 * body: { teamAId, teamBId, problemIds: [], durationMinutes }
 */
router.post("/", auth, async (req, res) => {
  try {
    const { teamAId, teamBId, problemIds, durationMinutes } = req.body;

    if (!teamAId || !teamBId || teamAId === teamBId) {
      return res
        .status(400)
        .json({ message: "Please provide two different teams." });
    }

    if (!Array.isArray(problemIds) || problemIds.length === 0) {
      return res
        .status(400)
        .json({ message: "Select at least one problem." });
    }

    const [teamA, teamB] = await Promise.all([
      Team.findById(teamAId),
      Team.findById(teamBId),
    ]);

    if (!teamA || !teamB) {
      return res.status(404).json({ message: "One or both teams not found." });
    }

    const problems = await Problem.find({ _id: { $in: problemIds } });
    if (!problems.length) {
      return res.status(400).json({ message: "Problems not found." });
    }

    const roomCode = `tb_${Date.now().toString(36)}`;
    const timeLimitSeconds = (durationMinutes || 90) * 60;

    const participants = [
      ...teamA.members.map((u) => ({ user: u, teamSide: "A" })),
      ...teamB.members.map((u) => ({ user: u, teamSide: "B" })),
    ];

    const now = new Date();

    const battle = await TeamBattle.create({
      roomCode,
      status: "ongoing",
      problems: problems.map((p) => p._id),
      timeLimitSeconds,
      startTime: now,
      teamA: { team: teamA._id, score: 0, solved: 0, totalTimeSeconds: 0 },
      teamB: { team: teamB._id, score: 0, solved: 0, totalTimeSeconds: 0 },
      participants,
      perUserProblem: [],
    });

    return res.status(201).json({
      battleId: battle._id,
      roomCode: battle.roomCode,
      timeLimitSeconds: battle.timeLimitSeconds,
    });
  } catch (err) {
    console.error("Create team battle error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * Get battle details
 * GET /team-battles/:id
 */
router.get("/:id", auth, async (req, res) => {
  try {
    const battle = await TeamBattle.findById(req.params.id)
      .populate("teamA.team", "name members")
      .populate("teamB.team", "name members")
      .populate("participants.user", "username")
      .populate("problems", "title difficulty slug");

    if (!battle) {
      return res.status(404).json({ message: "Battle not found" });
    }

    return res.json(battle);
  } catch (err) {
    console.error("Get team battle error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
