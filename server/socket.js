// server/socket.js
const jwt = require("jsonwebtoken");
const axios = require("axios");
const { runSubmission } = require("./utils/judge0");
const Submission = require("./models/Submission");
const Problem = require("./models/Problem"); // adjust case/name if needed

module.exports = function initSocket(io) {
  // duelId -> { players:Set, submissions:Map, timers:{}, startedAt, problem }
  const duels = new Map();
  // socket.id -> last submit timestamp
  const lastSubmitAt = new Map();

  const DEFAULT_SUBMIT_TIMEOUT_MS = 30_000;
  const DEFAULT_DUEL_TTL_MS = 5 * 60_000;
  const MIN_SUBMIT_INTERVAL_MS = 3_000;

  io.on("connection", (socket) => {
    // ---------- JOIN ROOM ----------
    socket.on("join_duel", ({ duelId, roomId, userId } = {}) => {
      const id = duelId || roomId;
      if (!id || !userId) {
        socket.emit("duel_error", { message: "missing duelId or userId" });
        return;
      }

      socket.join(id);

      let duel = duels.get(id);
      if (!duel) {
        duel = {
          players: new Set(),
          submissions: new Map(),
          timers: {},
          startedAt: null,
          problem: null,
        };
        duels.set(id, duel);
      }

      duel.players.add(userId);

      const playersArr = Array.from(duel.players).map((uid) => ({ id: uid }));
      io.to(id).emit("room_update", {
        players: playersArr,
        started: !!duel.startedAt,
      });
    });

    // ---------- START DUEL ----------
    socket.on("start_duel", async ({ duelId, roomId, problemId } = {}, ack) => {
      const id = duelId || roomId;
      if (!id) {
        if (typeof ack === "function") {
          ack({ ok: false, message: "missing duelId" });
        }
        return;
      }

      let duel = duels.get(id);
      if (!duel) {
        duel = {
          players: new Set(),
          submissions: new Map(),
          timers: {},
          startedAt: null,
          problem: null,
        };
        duels.set(id, duel);
      }

      // ⚠️ allow starting with 1 player (useful for local testing)
      if ((duel.players.size || 0) < 1) {
        if (typeof ack === "function") {
          ack({ ok: false, message: "need at least 1 player in the room" });
        }
        return;
      }

      try {
        // Load problem (given or random)
        let problemDoc;
        if (problemId) {
          problemDoc = await Problem.findById(problemId).lean();
          if (!problemDoc) throw new Error("problem not found");
        } else {
          const sampled = await Problem.aggregate([{ $sample: { size: 1 } }]);
          problemDoc = sampled && sampled[0] ? sampled[0] : null;
          if (!problemDoc) throw new Error("no problems available");
        }

        // Tests: prefer hiddenTests for judging, fall back to exampleTests
        const rawTests =
          (Array.isArray(problemDoc.hiddenTests) &&
            problemDoc.hiddenTests.length > 0 &&
            problemDoc.hiddenTests) ||
          (Array.isArray(problemDoc.exampleTests) && problemDoc.exampleTests) ||
          [];

        const tests = rawTests.map((t) => ({
          input: (t.input ?? t.stdin ?? "").toString(),
          output: (t.output ?? t.expected ?? t.out ?? "").toString(),
        }));

        const publicProblem = {
          _id: problemDoc._id,
          title: problemDoc.title,
          description: problemDoc.description || problemDoc.statement || "",
          exampleTests: problemDoc.exampleTests || [],
          inputFormat: problemDoc.inputFormat || null,
          outputFormat: problemDoc.outputFormat || null,
          constraints: problemDoc.constraints || null,
          difficulty: problemDoc.difficulty || null,
          slug: problemDoc.slug || null,
        };

        duel.problem = {
          id: problemDoc._id.toString(),
          tests,
          timeLimitMs: problemDoc.timeLimitMs || DEFAULT_SUBMIT_TIMEOUT_MS,
        };
        duel.startedAt = Date.now();

        // TTL timer to auto-finish duel
        if (duel.timers.ttlTimer) clearTimeout(duel.timers.ttlTimer);
        duel.timers.ttlTimer = setTimeout(() => {
          completeDuelWithForfeit(id);
        }, DEFAULT_DUEL_TTL_MS);

        if (typeof ack === "function") {
          ack({ ok: true, problemId: duel.problem.id });
        }

        io.to(id).emit("duel_started", {
          duelId: id,
          problemId: duel.problem.id,
          problem: publicProblem,
          testsCount: duel.problem.tests.length,
          startedAt: duel.startedAt,
        });
      } catch (err) {
        console.error("start_duel error", err);
        if (typeof ack === "function") {
          ack({ ok: false, message: err.message || "failed to start duel" });
        }
      }
    });

    // ---------- SUBMIT CODE ----------
    socket.on("duel_submit_code", async (payload = {}, ack) => {
      try {
        const now = Date.now();
        const last = lastSubmitAt.get(socket.id) || 0;
        if (now - last < MIN_SUBMIT_INTERVAL_MS) {
          if (typeof ack === "function") {
            ack({ ok: false, message: "submitting too quickly" });
          }
          return;
        }
        lastSubmitAt.set(socket.id, now);

        const { duelId, roomId, userId, code, languageId, stdin } = payload;
        const id = duelId || roomId;

        if (!id || !userId || !code || !languageId) {
          if (typeof ack === "function") {
            ack({ ok: false, message: "missing fields" });
          }
          return;
        }

        const duel = duels.get(id);
        if (!duel || !duel.problem) {
          if (typeof ack === "function") {
            ack({ ok: false, message: "duel or problem not initialized" });
          }
          return;
        }

        // Create submission record (no custom status: schema default is used)
        let submissionDoc;
        try {
          submissionDoc = new Submission({
            user: userId,
            problem: duel.problem.id,
            code,
            language: languageId, // "python" | "javascript" | "cpp" – same as problems page
            createdAt: new Date(),
          });
          await submissionDoc.save();
        } catch (e) {
          console.error("Failed to save duel submission", e);
          if (typeof ack === "function") {
            ack({ ok: false, message: "failed to create submission" });
          }
          return;
        }

        const tests = duel.problem.tests || [];
        const results = [];
        let passedCount = 0;
        const perTestTimeout =
          duel.problem.timeLimitMs || DEFAULT_SUBMIT_TIMEOUT_MS;

        // Judge against all tests sequentially (simpler and safe)
        for (let i = 0; i < tests.length; i++) {
          const test = tests[i];

          const runPromise = runSubmission({
            source: code,
            language_id: languageId, // runSubmission handles mapping internally
            stdin: test.input ?? stdin ?? "",
          });

          const res = await promiseWithTimeout(
            runPromise,
            perTestTimeout
          ).catch((e) => ({
            status: { description: "Error/Timeout" },
            stdout: "",
            stderr: String(e),
          }));

          const stdout = (res.stdout ?? res.stdout_text ?? "") + "";
          const stderr = (res.stderr ?? res.stderr_text ?? "") + "";
          const passed = compareOutput(stdout, test.output ?? "");
          if (passed) passedCount++;

          results.push({
            testIndex: i,
            passed,
            stdout,
            stderr,
            status: res.status || {},
          });
        }

        const totalTests = tests.length;
        const accepted = totalTests > 0 && passedCount === totalTests;

        // Update submission doc with summary ONLY (no 'details' field!)
        submissionDoc.passed = passedCount;
        submissionDoc.total = totalTests;
        submissionDoc.completedAt = new Date();
        try {
          await submissionDoc.save();
        } catch (e) {
          console.error("Failed to update submission after judging", e);
        }

        // In-memory duel state
        duel.submissions.set(userId, {
          submissionId: submissionDoc._id.toString(),
          passedCount,
          total: totalTests,
          details: results,
          completedAt: Date.now(),
        });

        // Broadcast detailed result to both players
        io.to(id).emit("duel_submission_result", {
          duelId: id,
          submissionId: submissionDoc._id,
          userId,
          passedCount,
          total: totalTests,
          details: results,
          accepted,
        });

        // If both players have at least one submission, decide winner
        if (duel.players.size >= 2 && duel.submissions.size >= 2) {
          finalizeDuel(id);
        }

        // ACK back to the submitter with verdict
        if (typeof ack === "function") {
          const first = results[0] || {};
          ack({
            ok: true,
            accepted,
            judge: {
              status: first.status || {},
              stdout: first.stdout,
              stderr: first.stderr,
            },
          });
        }
      } catch (err) {
        console.error("duel_submit_code error", err);
        if (typeof ack === "function") {
          ack({ ok: false, message: err.message || "server error" });
        }
      }
    });

    // ---------- DISCONNECT ----------
    socket.on("disconnect", () => {
      lastSubmitAt.delete(socket.id);
    });
  });

  // ---------- HELPERS ----------
  function promiseWithTimeout(promise, ms) {
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error("timeout")), ms);
      promise
        .then((v) => {
          clearTimeout(t);
          resolve(v);
        })
        .catch((e) => {
          clearTimeout(t);
          reject(e);
        });
    });
  }

  function compareOutput(actual, expected) {
    if (expected == null) return false;
    return String(actual).trim() === String(expected).trim();
  }

  async function finalizeDuel(duelId) {
    const duel = duels.get(duelId);
    if (!duel) return;

    const entries = Array.from(duel.submissions.entries());
    if (entries.length < 2) return;

    const [aUid, aRes] = entries[0];
    const [bUid, bRes] = entries[1];

    let winner = null;
    if (aRes.passedCount > bRes.passedCount) winner = aUid;
    else if (bRes.passedCount > aRes.passedCount) winner = bUid;
    else {
      if ((aRes.completedAt || 0) < (bRes.completedAt || 0)) winner = aUid;
      else if ((bRes.completedAt || 0) < (aRes.completedAt || 0)) winner = bUid;
      else winner = null;
    }

    if (duel.timers.ttlTimer) clearTimeout(duel.timers.ttlTimer);

    io.to(duelId).emit("duel_finished", {
      duelId,
      winner,
      summary: {
        submissions: entries.map(([uid, res]) => ({
          userId: uid,
          passed: res.passedCount,
          total: res.total,
          completedAt: res.completedAt,
        })),
      },
    });

    // Clean up duel after a minute
    setTimeout(() => duels.delete(duelId), 60_000);
  }

  function completeDuelWithForfeit(duelId) {
    const duel = duels.get(duelId);
    if (!duel) return;

    const submitted = Array.from(duel.submissions.keys());
    let winner = null;
    if (submitted.length === 1) winner = submitted[0];

    io.to(duelId).emit("duel_finished", {
      duelId,
      winner,
      summary: {
        submissions: submitted.map((uid) => ({
          userId: uid,
          passed: duel.submissions.get(uid)?.passedCount || 0,
          total: duel.submissions.get(uid)?.total || 0,
          completedAt: duel.submissions.get(uid)?.completedAt || null,
        })),
      },
    });

    if (duel.timers.ttlTimer) clearTimeout(duel.timers.ttlTimer);
    setTimeout(() => duels.delete(duelId), 60_000);
  }
};
