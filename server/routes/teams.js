// server/routes/teams.js
const express = require("express");
const Team = require("../models/Team");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * Create a team
 * POST /teams
 * body: { name, memberIds?: [userId1, userId2, ...] }
 * captain = current user, and they are always in members
 */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { name, memberIds = [] } = req.body;
    // auth middleware sets req.user.id
    const captainId = req.user.id;

    if (!name) {
      return res.status(400).json({ message: "Team name is required" });
    }

    // Normalize memberIds to strings
    const normalizedMemberIds = Array.isArray(memberIds)
      ? memberIds
          .map((id) => (id ? id.toString() : null))
          .filter(Boolean)
      : [];

    // captain + optional memberIds, make them unique
    const uniqueMembers = Array.from(
      new Set([captainId.toString(), ...normalizedMemberIds])
    );

    const team = await Team.create({
      name,
      captain: captainId,
      members: uniqueMembers, // mongoose will cast these strings to ObjectId
    });

    res.status(201).json(team);
  } catch (err) {
    console.error("Create team error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * Get teams where current user is a member
 * GET /teams/mine
 */
router.get("/mine", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const teams = await Team.find({
      members: userId,
    }).populate("members", "username");

    res.json(teams);
  } catch (err) {
    console.error("Get my teams error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * Get all teams
 * GET /teams
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const teams = await Team.find().populate("members", "username");
    res.json(teams);
  } catch (err) {
    console.error("Get teams error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * Join a team
 * POST /teams/:id/join
 */
router.post("/:id/join", authMiddleware, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    const userId = req.user.id.toString();

    // already a member?
    if (team.members.some((m) => m.toString() === userId)) {
      return res.status(400).json({ message: "You are already in this team." });
    }

    team.members.push(userId);
    await team.save();

    res.json({ message: "Joined team successfully", teamId: team._id });
  } catch (err) {
    console.error("Join team error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
