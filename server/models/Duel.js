// server/models/Duel.js
const mongoose = require("mongoose");

const DuelSchema = new mongoose.Schema(
  {
    playerA: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    playerB: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    winner: { type: String, enum: ["A", "B", "draw"], required: true },

    problem: { type: mongoose.Schema.Types.ObjectId, ref: "Problem" },
    durationSeconds: { type: Number, default: 0 },

    roomId: { type: String }, // optional, link to your duel room
  },
  { timestamps: true }
);

module.exports = mongoose.model("Duel", DuelSchema);
