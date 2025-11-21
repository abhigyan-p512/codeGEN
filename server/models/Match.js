const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["1v1", "team"], required: true },

    contest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contest",
      required: true,
    },

    // For 1v1
    players: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // For team vs team
    teams: [{ type: mongoose.Schema.Types.ObjectId, ref: "Team" }],

    status: {
      type: String,
      enum: ["pending", "ongoing", "finished"],
      default: "pending",
    },

    winnerUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    winnerTeam: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Match", matchSchema);
