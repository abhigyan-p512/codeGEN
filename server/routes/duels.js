// server/routes/duels.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Duel = require("../models/Duel");              // ✅ FIXED PATH
const User = require("../models/User");              // ✅ FIXED PATH
const authMiddleware = require("../middleware/authMiddleware"); // ✅ FIXED PATH

// Basic rating update helper
function updateRatings(ratingA, ratingB, result) {
  const K = 30;
  const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  const expectedB = 1 / (1 + Math.pow(10, (ratingA - ratingB) / 400));

  let scoreA, scoreB;
  if (result === "A") {
    scoreA = 1;
    scoreB = 0;
  } else if (result === "B") {
    scoreA = 0;
    scoreB = 1;
  } else {
    scoreA = 0.5;
    scoreB = 0.5;
  }

  const newA = Math.round(ratingA + K * (scoreA - expectedA));
  const newB = Math.round(ratingB + K * (scoreB - expectedB));
  return { newA, newB };
}

/**
 * POST /duels/finish
 * body: { playerAId, playerBId, winner, problemId, durationSeconds, roomId }
 * winner: "A" | "B" | "draw"
 */
router.post("/finish", authMiddleware, async (req, res) => {
  try {
    const { playerAId, playerBId, winner, problemId, durationSeconds, roomId } =
      req.body;

    if (!playerAId || !playerBId || !winner) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const playerA = await User.findById(playerAId);
    const playerB = await User.findById(playerBId);

    if (!playerA || !playerB) {
      return res.status(404).json({ message: "Players not found" });
    }

    const oldRatingA = playerA.rating || 1500;
    const oldRatingB = playerB.rating || 1500;

    const { newA, newB } = updateRatings(oldRatingA, oldRatingB, winner);

    const duel = await Duel.create({
      playerA: playerA._id,
      playerB: playerB._id,
      winner,
      problem: problemId || null,
      durationSeconds: durationSeconds || 0,
      roomId,
    });

    const incA = {};
    const incB = {};

    if (winner === "A") {
      incA.duelWins = 1;
      incB.duelLosses = 1;
    } else if (winner === "B") {
      incB.duelWins = 1;
      incA.duelLosses = 1;
    }

    await User.findByIdAndUpdate(playerA._id, {
      $set: { rating: newA },
      $inc: incA,
    });
    await User.findByIdAndUpdate(playerB._id, {
      $set: { rating: newB },
      $inc: incB,
    });

    return res.status(201).json({
      message: "Duel recorded",
      duelId: duel._id,
      ratings: {
        playerA: { old: oldRatingA, new: newA },
        playerB: { old: oldRatingB, new: newB },
      },
    });
  } catch (err) {
    console.error("Finish duel error:", err);
    res.status(500).json({ message: "Server error finishing duel" });
  }
});

// GET /duels/mine
router.get("/mine", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const duels = await Duel.find({
      $or: [{ playerA: userId }, { playerB: userId }],
    })
      .populate("playerA", "username")
      .populate("playerB", "username")
      .populate("problem", "title slug")
      .sort({ createdAt: -1 });

    res.json(duels);
  } catch (err) {
    console.error("Get duels error:", err);
    res.status(500).json({ message: "Server error loading duels" });
  }
});

module.exports = router;
