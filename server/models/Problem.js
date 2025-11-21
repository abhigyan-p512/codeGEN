const mongoose = require("mongoose");

const exampleSchema = new mongoose.Schema({
  input: String,
  output: String,
});

const testCaseSchema = new mongoose.Schema({
  input: String,
  output: String,
});

const problemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      required: true,
    },
    description: { type: String, required: true },
    exampleTests: [exampleSchema],
    hiddenTests: [testCaseSchema],   // NEW FIELD
  },
  { timestamps: true }
);

module.exports = mongoose.model("Problem", problemSchema);
