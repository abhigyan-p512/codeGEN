// server/routes/problems.js
const express = require("express");
const Problem = require("../models/Problem");

const router = express.Router();

/**
 * GET /problems
 * List problems with optional search & difficulty filter
 * Query params:
 *   search (string) - matches title
 *   difficulty (string) - Easy | Medium | Hard
 */
router.get("/", async (req, res) => {
  try {
    const { search, difficulty } = req.query;

    const query = {};

    if (search && search.trim()) {
      query.title = { $regex: search.trim(), $options: "i" };
    }

    if (difficulty && difficulty !== "All") {
      query.difficulty = difficulty;
    }

    const problems = await Problem.find(query)
      .select("title slug difficulty tags createdAt")
      .sort({ createdAt: 1 });

    res.json(problems);
  } catch (err) {
    console.error("Get problems error:", err);
    res.status(500).json({ message: "Server error loading problems" });
  }
});

/**
 * GET /problems/:slug
 * Get a single problem by slug (or id as fallback)
 */
router.get("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    let problem = await Problem.findOne({ slug });

    // Fallback: allow direct _id access if slug looks like ObjectId
    if (!problem && slug.match(/^[0-9a-fA-F]{24}$/)) {
      problem = await Problem.findById(slug);
    }

    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    res.json(problem);
  } catch (err) {
    console.error("Get problem error:", err);
    res.status(500).json({ message: "Server error loading problem" });
  }
});

module.exports = router;
