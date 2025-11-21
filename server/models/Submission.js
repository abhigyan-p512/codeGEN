// server/models/Submission.js
const mongoose = require("mongoose");

const submissionDetailsSchema = new mongoose.Schema(
  {
    wrongTest: { type: Number },
    expected: { type: String },
    actual: { type: String },
  },
  { _id: false }
);

const submissionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem",
      required: true,
    },
    contest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contest",
      default: null,
    },
    code: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      enum: [
        "python",
        "javascript",
        "cpp",
        "java",
        "c",
        "go",
        "other",
      ],
      required: true,
    },
    status: {
      type: String,
      enum: ["Submitted", "Accepted", "Rejected", "Error"],
      default: "Submitted",
    },
    details: {
      type: submissionDetailsSchema,
      default: null,
    },
    runtimeMs: {
      type: Number,
      default: null,
    },
    memoryKb: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Submission", submissionSchema);
