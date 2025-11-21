const express = require("express");
const User = require("../models/User");
const Submission = require("../models/Submission");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// GET /profile/me - get current user info + stats
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId).select("username email createdAt");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const totalSubmissions = await Submission.countDocuments({ user: userId });
    const acceptedSubmissions = await Submission.countDocuments({
      user: userId,
      status: "Accepted",
    });
    const distinctSolvedProblems = await Submission.distinct("problem", {
      user: userId,
      status: "Accepted",
    });

    res.json({
      user,
      stats: {
        totalSubmissions,
        acceptedSubmissions,
        totalSolvedProblems: distinctSolvedProblems.length,
      },
    });
  } catch (err) {
    console.error("Profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
