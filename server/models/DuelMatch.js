const mongoose = require("mongoose");

const duelMatchSchema = new mongoose.Schema({
  players: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      score: { type: Number, default: 0 }
    }
  ],
  problem: { type: mongoose.Schema.Types.ObjectId, ref: "Problem" },
  status: { type: String, default: "waiting" }, // waiting, active, finished
  startTime: Date,
  winner: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
});

module.exports = mongoose.model("DuelMatch", duelMatchSchema);
