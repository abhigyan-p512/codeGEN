const mongoose = require("mongoose");

const contestProblemSchema = new mongoose.Schema({
  problem: { type: mongoose.Schema.Types.ObjectId, ref: "Problem", required: true },
  points: { type: Number, default: 100 }, // points per problem
});

const contestSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    problems: [contestProblemSchema], // which problems are in this contest
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // users who joined
  },
  { timestamps: true }
);

module.exports = mongoose.model("Contest", contestSchema);
