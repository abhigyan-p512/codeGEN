// server/models/TeamBattle.js
const mongoose = require("mongoose");

const participantSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    teamSide: { type: String, enum: ["A", "B"], required: true },
    score: { type: Number, default: 0 },
    solved: { type: Number, default: 0 },
    totalTimeSeconds: { type: Number, default: 0 },
  },
  { _id: false }
);

const teamStatsSchema = new mongoose.Schema(
  {
    team: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true },
    score: { type: Number, default: 0 },
    solved: { type: Number, default: 0 },
    totalTimeSeconds: { type: Number, default: 0 },
  },
  { _id: false }
);

const perUserProblemSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem",
      required: true,
    },
    solved: { type: Boolean, default: false },
    wrongAttempts: { type: Number, default: 0 },
  },
  { _id: false }
);

const teamBattleSchema = new mongoose.Schema(
  {
    roomCode: { type: String, required: true, unique: true },

    status: {
      type: String,
      enum: ["waiting", "ongoing", "finished"],
      default: "waiting",
    },

    mode: { type: String, default: "sum-of-members" },

    problems: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Problem", required: true },
    ],

    timeLimitSeconds: { type: Number, default: 1800 },
    startTime: Date,
    endTime: Date,

    teamA: teamStatsSchema,
    teamB: teamStatsSchema,

    participants: [participantSchema],

    // tracking per-user-per-problem to avoid double scoring
    perUserProblem: [perUserProblemSchema],

    winner: { type: String, enum: ["A", "B", "draw", null], default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TeamBattle", teamBattleSchema);
