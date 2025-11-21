// server/routes/contests.js
const express = require("express");
const Contest = require("../models/Contest");
const Problem = require("../models/Problem");
const Submission = require("../models/Submission");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * GET /contests
 * List all contests (basic info)
 */
router.get("/", async (req, res) => {
  try {
    const contests = await Contest.find()
      .select("name description startTime endTime")
      .sort({ startTime: 1 });

    res.json(contests);
  } catch (err) {
    console.error("Get contests error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET /contests/:id
 * Get details of a single contest, including problems
 */
router.get("/:id", async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id).populate(
      "problems.problem",
      "title slug difficulty"
    );

    if (!contest) {
      return res.status(404).json({ message: "Contest not found" });
    }

    res.json(contest);
  } catch (err) {
    console.error("Get contest error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * POST /contests
 * Create a new contest (currently any logged-in user can create)
 */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { name, description, startTime, endTime, problemIds } = req.body;

    if (!name || !startTime || !endTime || !problemIds || !problemIds.length) {
      return res
        .status(400)
        .json({ message: "Missing required fields or problems." });
    }

    const problems = await Problem.find({
      _id: { $in: problemIds },
    }).select("_id");

    if (!problems.length) {
      return res.status(400).json({ message: "No valid problems found." });
    }

    const contest = await Contest.create({
      name,
      description,
      startTime,
      endTime,
      problems: problems.map((p) => ({
        problem: p._id,
        points: 100,
      })),
      participants: [],
    });

    res.status(201).json(contest);
  } catch (err) {
    console.error("Create contest error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * POST /contests/:id/join
 * Join a contest
 */
router.post("/:id/join", authMiddleware, async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id);
    if (!contest) {
      return res.status(404).json({ message: "Contest not found" });
    }

    const userId = req.user.userId;
    if (!contest.participants.includes(userId)) {
      contest.participants.push(userId);
      await contest.save();
    }

    res.json({ message: "Joined contest", contestId: contest._id });
  } catch (err) {
    console.error("Join contest error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET /contests/:id/leaderboard
 * Simple leaderboard based on accepted submissions
 */
router.get("/:id/leaderboard", authMiddleware, async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id);
    if (!contest) {
      return res.status(404).json({ message: "Contest not found" });
    }

    const subs = await Submission.find({ contest: contest._id })
      .populate("user", "username")
      .populate("problem", "title");

    const scores = new Map();

    for (const s of subs) {
      const userId = s.user._id.toString();
      if (!scores.has(userId)) {
        scores.set(userId, {
          userId,
          username: s.user.username,
          score: 0,
          solvedCount: 0,
        });
      }

      const entry = scores.get(userId);
      if (s.status === "Accepted") {
        entry.score += 100;
        entry.solvedCount += 1;
      }
    }

    const leaderboard = Array.from(scores.values()).sort(
      (a, b) => b.score - a.score
    );

    res.json(leaderboard);
  } catch (err) {
    console.error("Leaderboard error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
