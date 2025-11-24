// server/routes/judge.js
const express = require("express");
const axios = require("axios");

const router = express.Router();

const JUDGE0_URL = process.env.JUDGE0_URL || "https://ce.judge0.com";

// map our language name -> Judge0 language_id
function mapLanguage(language) {
  switch (language) {
    case "cpp":
      return 54; // C++ (GCC 9.2.0)
    case "python":
      return 71; // Python 3.8.1
    case "java":
      return 62; // Java (OpenJDK 13)
    case "c":
      return 50; // C (GCC 9.2.0)
    case "javascript":
    default:
      return 63; // Node.js
  }
}

/**
 * POST /judge/run
 * body: { code, language, input }
 * response: { output, raw }
 */
router.post("/run", async (req, res) => {
  try {
    const { code, language, input } = req.body;

    if (!code || !language) {
      return res
        .status(400)
        .json({ error: "Code and language are required." });
    }

    const languageId = mapLanguage(language);

    const { data } = await axios.post(
      `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
      {
        source_code: code,
        language_id: languageId,
        stdin: input || "",
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 60000,
      }
    );

    const stdout = data.stdout || "";
    const stderr = data.stderr || data.compile_output || "";

    const output =
      stdout.trim() ||
      stderr.trim() ||
      "Program finished with no output.";

    // 👈 VERY IMPORTANT: Problems page & SimpleCodeEditor both expect `output`
    res.json({
      output,
      raw: data, // optional debug info
    });
  } catch (err) {
    console.error("Runner /judge/run error:", err.response?.data || err.message);
    res
      .status(500)
      .json({ error: "Error running code on Judge0. Please try again." });
  }
});

module.exports = router;
