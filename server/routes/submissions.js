// server/routes/submissions.js
const express = require("express");
const axios = require("axios");
const Submission = require("../models/Submission");
const Problem = require("../models/Problem");
const auth = require("../middleware/authMiddleware");

const router = express.Router();

const JUDGE0_URL = process.env.JUDGE0_URL || "https://ce.judge0.com";

// Map our language name -> Judge0 language_id
function mapLanguage(language) {
  switch (language) {
    case "cpp":
      return 54; // C++ (GCC)
    case "python":
      return 71; // Python 3
    case "javascript":
    default:
      return 63; // Node.js
  }
}

/**
 * Create a submission with auto-judge on example tests
 * POST /submissions
 * body: { problemId, code, language, contestId? }
 */
router.post("/", auth, async (req, res) => {
  try {
    const { problemId, code, language, contestId } = req.body;

    if (!problemId || !code || !language) {
      return res.status(400).json({
        message: "problemId, code and language are required",
      });
    }

    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    const tests = problem.exampleTests || [];
    const totalTests = tests.length;

    // If no tests configured, just mark as Submitted
    if (totalTests === 0) {
      const submission = await Submission.create({
        user: req.user.id,
        problem: problemId,
        code,
        language,
        status: "Submitted",
        contest: contestId || null,
      });

      return res.json({
        ok: true,
        status: "Submitted",
        totalTests: 0,
        submission: {
          id: submission._id,
          status: submission.status,
          createdAt: submission.createdAt,
        },
      });
    }

    let finalStatus = "Accepted";
    let wrongIndex = null;
    let expected = null;
    let actual = null;

    const languageId = mapLanguage(language);

    for (let i = 0; i < totalTests; i++) {
      const t = tests[i];

      const { data } = await axios.post(
        `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
        {
          source_code: code,
          language_id: languageId,
          stdin: t.input || "",
        },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 60000,
        }
      );

      const stdout = (data.stdout || "").trim();
      const stderr = (data.stderr || data.compile_output || "").trim();

      // If compilation/runtime error -> reject
      if (stderr) {
        finalStatus = "Rejected";
        wrongIndex = i;
        expected = (t.output || "").trim();
        actual = stderr;
        break;
      }

      const out = stdout;
      if (out !== (t.output || "").trim()) {
        finalStatus = "Rejected";
        wrongIndex = i;
        expected = (t.output || "").trim();
        actual = out;
        break;
      }
    }

    const details =
      finalStatus === "Rejected"
        ? {
            wrongTest: wrongIndex,
            expected,
            actual,
          }
        : null;

    const submission = await Submission.create({
      user: req.user.id,
      problem: problemId,
      code,
      language,
      status: finalStatus,
      contest: contestId || null,
      details,
    });

    return res.json({
      ok: true,
      status: finalStatus,
      totalTests,
      wrongTest: wrongIndex,
      expected,
      actual,
      submission: {
        id: submission._id,
        status: submission.status,
        createdAt: submission.createdAt,
      },
    });
  } catch (err) {
    console.error("Create submission error:", err);
    return res
      .status(500)
      .json({ message: "Server error while judging submission" });
  }
});

/**
 * Get current user's submissions
 * GET /submissions/mine
 */
router.get("/mine", auth, async (req, res) => {
  try {
    const submissions = await Submission.find({ user: req.user.id })
      .populate("problem", "title slug")
      .sort({ createdAt: -1 });

    res.json(submissions);
  } catch (err) {
    console.error("Get submissions error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
