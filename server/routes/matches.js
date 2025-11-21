const express = require("express");
const Match = require("../models/Match");
const Contest = require("../models/Contest");
const Problem = require("../models/Problem");
const Team = require("../models/Team");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * 1v1 match:
 * - body: { opponentId, problemIds, durationMinutes }
 * - creates a small contest + a match of type "1v1"
 */
router.post("/1v1", authMiddleware, async (req, res) => {
  try {
    const { opponentId, problemIds, durationMinutes = 60 } = req.body;
    const challengerId = req.user.userId;

    if (!opponentId || !problemIds || !problemIds.length) {
      return res
        .status(400)
        .json({ message: "opponentId and problemIds are required" });
    }

    const problems = await Problem.find({ _id: { $in: problemIds } }).select("_id");
    if (!problems.length) {
      return res.status(400).json({ message: "No valid problems found" });
    }

    const now = new Date();
    const endTime = new Date(now.getTime() + durationMinutes * 60000);

    const contest = await Contest.create({
      name: "1v1 Battle",
      description: "Head-to-head coding duel.",
      startTime: now,
      endTime,
      problems: problems.map((p) => ({ problem: p._id, points: 100 })),
      participants: [challengerId, opponentId],
    });

    const match = await Match.create({
      type: "1v1",
      contest: contest._id,
      players: [challengerId, opponentId],
      status: "ongoing",
    });

    res.status(201).json({ match, contest });
  } catch (err) {
    console.error("Create 1v1 match error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * Team vs Team match:
 * - body: { teamAId, teamBId, problemIds, durationMinutes }
 */
router.post("/team", authMiddleware, async (req, res) => {
  try {
    const { teamAId, teamBId, problemIds, durationMinutes = 90 } = req.body;

    if (!teamAId || !teamBId || !problemIds || !problemIds.length) {
      return res
        .status(400)
        .json({ message: "teamAId, teamBId and problemIds are required" });
    }

    const problems = await Problem.find({ _id: { $in: problemIds } }).select("_id");
    if (!problems.length) {
      return res.status(400).json({ message: "No valid problems found" });
    }

    const teamA = await Team.findById(teamAId);
    const teamB = await Team.findById(teamBId);
    if (!teamA || !teamB) {
      return res.status(404).json({ message: "Team not found" });
    }

    const now = new Date();
    const endTime = new Date(now.getTime() + durationMinutes * 60000);

    const participants = [...teamA.members, ...teamB.members];

    const contest = await Contest.create({
      name: "Team Battle",
      description: `${teamA.name} vs ${teamB.name}`,
      startTime: now,
      endTime,
      problems: problems.map((p) => ({ problem: p._id, points: 100 })),
      participants,
    });

    const match = await Match.create({
      type: "team",
      contest: contest._id,
      teams: [teamAId, teamBId],
      status: "ongoing",
    });

    res.status(201).json({ match, contest });
  } catch (err) {
    console.error("Create team match error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get match details (with contest + players/teams)
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate("contest")
      .populate("players", "username")
      .populate("teams", "name");

    if (!match) {
      return res.status(404).json({ message: "Match not found" });
    }

    res.json(match);
  } catch (err) {
    console.error("Get match error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
