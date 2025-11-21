const axios = require("axios");

const TIMEOUT = parseInt(process.env.JUDGE0_TIMEOUT || "60000", 10);
const JUDGE0_URL =
  (process.env.JUDGE0_URL && process.env.JUDGE0_URL.replace(/\/$/, "")) ||
  "https://ce.judge0.com";
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY || "";

const client = axios.create({
  baseURL: JUDGE0_URL,
  timeout: TIMEOUT,
  headers: { "Content-Type": "application/json" },
});

if (JUDGE0_API_KEY) {
  try {
    const host = new URL(JUDGE0_URL).host;
    client.defaults.headers["X-RapidAPI-Key"] = JUDGE0_API_KEY;
    client.defaults.headers["X-RapidAPI-Host"] = host;
  } catch (e) {}
}

function getLanguageId(lang) {
  const map = {
    python3: 71,
    cpp: 54,
    java: 62,
    javascript: 63,
    nodejs: 63,
    c: 50,
  };
  if (!lang) return null;
  if (typeof lang === "number") return lang;
  if (typeof lang === "string" && /^\d+$/.test(lang)) return Number(lang);
  return map[lang] || null;
}

function normalizeLangId(input) {
  let id = input;
  if (typeof id === "string") {
    if (/^\d+$/.test(id)) id = Number(id);
    else id = getLanguageId(id);
  } else if (typeof id === "undefined" || id === null) {
    id = null;
  }
  if (!id || Number(id) === 0) id = 71; // fallback to python3
  return Number(id);
}

function decodeBase64Field(f) {
  if (typeof f !== "string" || f === null) return null;
  try {
    return Buffer.from(f, "base64").toString("utf8");
  } catch (e) {
    return f;
  }
}

// runSubmission returns a normalized result with decoded text fields
async function runSubmission({ source, languageId, stdin = "" }) {
  const langId = normalizeLangId(languageId);
  const payload = {
    source_code: source,
    language_id: langId,
    stdin: stdin || "",
  };

  // Request base64-encoded outputs so we can reliably decode binary / special chars
  const path = "/submissions?wait=true&base64_encoded=true";

  try {
    const resp = await client.post(path, payload);
    const data = resp.data || {};

    // Judge0 with base64_encoded=true returns base64 strings in fields like stdout, stderr, compile_output, message
    const decoded = {
      raw: data,
      status: data.status || null,
      token: data.token || null,
      stdout: decodeBase64Field(data.stdout),
      stderr: decodeBase64Field(data.stderr),
      compile_output: decodeBase64Field(data.compile_output),
      message: decodeBase64Field(data.message),
      cpu_time: data.cpu_time || null,
      memory: data.memory || null,
    };

    // If no stdout but compile_output or stderr exists, prefer those for debugging
    if (!decoded.stdout && (decoded.compile_output || decoded.stderr || decoded.message)) {
      decoded.outputFallback =
        decoded.compile_output || decoded.stderr || decoded.message || null;
    } else {
      decoded.outputFallback = null;
    }

    return decoded;
  } catch (err) {
    if (err.response) {
      const status = err.response.status;
      const data = err.response.data;
      if (status === 422) {
        throw new Error(`Judge0 validation error: ${JSON.stringify(data)}`);
      } else if (status === 404) {
        throw new Error(`Judge0 endpoint not found. Check JUDGE0_URL (${JUDGE0_URL})`);
      } else {
        throw new Error(`Judge0 run error: ${status} ${JSON.stringify(data)}`);
      }
    }
    throw new Error("Judge0 run error: " + (err.message || String(err)));
  }
}

module.exports = { runSubmission, getLanguageId, normalizeLangId };