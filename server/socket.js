// server/socket.js
const axios = require("axios");
const Submission = require("./models/Submission");
const Problem = require("./models/Problem");
const User = require("./models/User"); // <-- to update duelWins / duelLosses

const JUDGE0_URL =
  process.env.JUDGE0_URL || "https://ce.judge0.com";

module.exports = function initSocket(io) {
  // duelId -> { players:Set<userId>, submissions:Map<userId,submission>, timers:{}, startedAt, problem }
  const duels = new Map();
  // socket.id -> last submit timestamp
  const lastSubmitAt = new Map();
  // socket.id -> { duelId, userId }
  const socketToPlayer = new Map();

  const DEFAULT_SUBMIT_TIMEOUT_MS = 30_000;
  const DEFAULT_DUEL_TTL_MS = 5 * 60_000;
  const MIN_SUBMIT_INTERVAL_MS = 3_000;

  // ---------- HELPERS ----------

  // Clean strings to avoid BOM / weird control chars in stdin / expected output / code
  function cleanStr(s) {
    if (s == null) return "";
    return String(s)
      .replace(/^[\u0000-\u001F\uFEFF]+/, "") // leading control chars + BOM
      .replace(/\r/g, "") // normalize CRLF
      .trimEnd();
  }

  // Map duel language to Judge0 language_id, same idea as /submissions route
  function mapLanguageId(lang) {
    if (lang == null) return null;

    if (typeof lang === "number") return lang;

    const s = String(lang).toLowerCase().trim();
    const asNum = Number(s);
    if (!Number.isNaN(asNum) && asNum > 0) return asNum;

    switch (s) {
      case "cpp":
        return 54;
      case "python":
      case "py":
      case "python3":
        return 71;
      case "javascript":
      case "js":
      case "node":
      default:
        return 63;
    }
  }

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
    const a = cleanStr(actual);
    const e = cleanStr(expected);
    return a === e;
  }

  // 🔥 Update duelWins / duelLosses in User collection
  async function updateDuelStats(duel, winnerUserId = null) {
    try {
      const allPlayers = Array.from(duel.players).filter(Boolean);
      if (!allPlayers.length) return;

      if (winnerUserId) {
        // Winner: +1 win
        await User.updateOne(
          { _id: winnerUserId },
          { $inc: { duelWins: 1 } }
        );

        // Others: +1 loss
        const losers = allPlayers.filter((id) => id !== winnerUserId);
        if (losers.length) {
          await User.updateMany(
            { _id: { $in: losers } },
            { $inc: { duelLosses: 1 } }
          );
        }
      } else {
        // Draw – currently we don't track draws separately.
        // If you add duelDraws later, increment it here.
      }
    } catch (err) {
      console.error("updateDuelStats error", err);
    }
  }

  // ---------- DUEL FINISH HELPERS ----------

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
      else if ((bRes.completedAt || 0) < (aRes.completedAt || 0))
        winner = bUid;
      else winner = null;
    }

    if (duel.timers.ttlTimer) clearTimeout(duel.timers.ttlTimer);

    // ⭐ update user stats
    await updateDuelStats(duel, winner);

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

    setTimeout(() => duels.delete(duelId), 60_000);
  }

  async function completeDuelWithForfeit(duelId) {
    const duel = duels.get(duelId);
    if (!duel) return;

    const submitted = Array.from(duel.submissions.keys());
    let winner = null;
    if (submitted.length === 1) winner = submitted[0];

    if (duel.timers.ttlTimer) clearTimeout(duel.timers.ttlTimer);

    // ⭐ update stats (winner may be null if nobody submitted)
    await updateDuelStats(duel, winner);

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

    setTimeout(() => duels.delete(duelId), 60_000);
  }

  // ---------- SOCKET IO ----------

  io.on("connection", (socket) => {
    console.log("socket connected", socket.id);

    // ---------- JOIN ROOM ----------
    socket.on("join_duel", ({ duelId, roomId, userId } = {}) => {
      const id = duelId || roomId;
      if (!id) {
        console.log("join_duel missing id", { duelId, roomId, userId });
        socket.emit("duel_error", { message: "missing duelId/roomId" });
        return;
      }

      const effectiveUserId = userId || socket.id;

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

      const wasEmpty = duel.players.size === 0; // first joiner = host

      duel.players.add(effectiveUserId);
      socket.join(id);
      socketToPlayer.set(socket.id, { duelId: id, userId: effectiveUserId });

      console.log("JOIN_DUEL handler", {
        duelId: id,
        userId: effectiveUserId,
        wasEmpty,
        playersSize: duel.players.size,
      });

      // host info → client decides whether to show Start button
      socket.emit("duel_role", { isHost: wasEmpty });

      const playersArr = Array.from(duel.players).map((uid) => ({ id: uid }));
      io.to(id).emit("room_update", {
        players: playersArr,
        started: !!duel.startedAt,
      });
    });

    // ---------- START DUEL ----------
    socket.on(
      "start_duel",
      async ({ duelId, roomId, problemId, userId } = {}, ack = () => {}) => {
        const joinInfo = socketToPlayer.get(socket.id);
        const id = duelId || roomId || joinInfo?.duelId;
        if (!id) {
          ack({ ok: false, message: "missing duelId/roomId" });
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

        if (duel.startedAt) {
          ack({ ok: false, message: "duel already started" });
          return;
        }

        const effectiveUserId = userId || joinInfo?.userId || socket.id;
        duel.players.add(effectiveUserId);

        console.log("start_duel", {
          duelId: id,
          starter: effectiveUserId,
          playersSize: duel.players.size,
        });

        try {
          // ---- Load a problem (specific or random) ----
          let problemDoc;
          if (problemId) {
            problemDoc = await Problem.findById(problemId).lean();
            if (!problemDoc) throw new Error("problem not found");
          } else {
            const sampled = await Problem.aggregate([{ $sample: { size: 1 } }]);
            problemDoc = sampled && sampled[0] ? sampled[0] : null;
            if (!problemDoc) throw new Error("no problems available");
          }

          const rawTests =
            (Array.isArray(problemDoc.hiddenTests) &&
              problemDoc.hiddenTests.length > 0 &&
              problemDoc.hiddenTests) ||
            (Array.isArray(problemDoc.exampleTests) &&
              problemDoc.exampleTests) ||
            [];

          const tests = rawTests.map((t) => ({
            input: cleanStr(t.input ?? t.stdin ?? ""),
            output: cleanStr(t.output ?? t.expected ?? t.out ?? ""),
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

          if (duel.timers.ttlTimer) clearTimeout(duel.timers.ttlTimer);
          duel.timers.ttlTimer = setTimeout(() => {
            completeDuelWithForfeit(id);
          }, DEFAULT_DUEL_TTL_MS);

          ack({ ok: true, problemId: duel.problem.id });

          io.to(id).emit("duel_started", {
            duelId: id,
            problemId: duel.problem.id,
            problem: publicProblem,
            testsCount: duel.problem.tests.length,
            startedAt: duel.startedAt,
          });
        } catch (err) {
          console.error("start_duel error", err);
          ack({ ok: false, message: err.message || "failed to start duel" });
          io.to(id).emit("duel_error", {
            message: err.message || "failed to start duel",
          });
        }
      }
    );

    // ---------- SUBMIT CODE (Judge0 logic same as /submissions) ----------
    socket.on("duel_submit_code", async (payload = {}, ack = () => {}) => {
      try {
        const now = Date.now();
        const last = lastSubmitAt.get(socket.id) || 0;
        if (now - last < MIN_SUBMIT_INTERVAL_MS) {
          ack({ ok: false, message: "submitting too quickly" });
          return;
        }
        lastSubmitAt.set(socket.id, now);

        const { duelId, roomId, userId, code, languageId, stdin } = payload;
        const joinInfo = socketToPlayer.get(socket.id);
        const id = duelId || roomId || joinInfo?.duelId;
        const judgeLangId = mapLanguageId(languageId);

        if (!id || !userId || !code || !judgeLangId) {
          ack({ ok: false, message: "missing fields" });
          return;
        }

        const duel = duels.get(id);
        if (!duel || !duel.problem) {
          console.log("duel_submit_code: duel/problem missing", {
            id,
            knownDuels: Array.from(duels.keys()),
          });
          ack({ ok: false, message: "duel or problem not initialized" });
          return;
        }

        // 🔑 Clean code to strip BOM / weird bytes that cause Non-UTF-8 error
        const cleanedCode = cleanStr(code);

        // ---- create submission doc ----
        let submissionDoc = new Submission({
          user: userId,
          problem: duel.problem.id,
          code: cleanedCode,
          // store language string (e.g. "python") to match enum
          language: languageId,
          createdAt: new Date(),
        });
        await submissionDoc.save();

        const tests = duel.problem.tests || [];
        const results = [];
        let passedCount = 0;
        const perTestTimeout =
          duel.problem.timeLimitMs || DEFAULT_SUBMIT_TIMEOUT_MS;

        for (let i = 0; i < tests.length; i++) {
          const test = tests[i];

          const body = {
            source_code: cleanedCode,
            language_id: judgeLangId,
            stdin: cleanStr(test.input ?? stdin ?? ""),
          };

          const judgePromise = axios.post(
            `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
            body,
            {
              headers: { "Content-Type": "application/json" },
              timeout: perTestTimeout + 5000,
            }
          );

          const data = await promiseWithTimeout(
            judgePromise,
            perTestTimeout
          )
            .then((r) => r.data)
            .catch((e) => ({
              status: { description: "Error/Timeout" },
              stdout: "",
              stderr: String(e),
            }));

          const stdout = cleanStr(data.stdout ?? data.stdout_text ?? "");
          const stderr = cleanStr(data.stderr ?? data.stderr_text ?? "");
          const expected = cleanStr(test.output ?? "");
          const passed = compareOutput(stdout, expected);
          if (passed) passedCount++;

          results.push({
            testIndex: i,
            passed,
            stdout,
            stderr,
            status: data.status || {},
          });
        }

        const totalTests = tests.length;
        const accepted = totalTests > 0 && passedCount === totalTests;

        submissionDoc.passed = passedCount;
        submissionDoc.total = totalTests;
        submissionDoc.completedAt = new Date();
        await submissionDoc.save();

        duel.submissions.set(userId, {
          submissionId: submissionDoc._id.toString(),
          passedCount,
          total: totalTests,
          details: results,
          completedAt: Date.now(),
        });

        io.to(id).emit("duel_submission_result", {
          duelId: id,
          submissionId: submissionDoc._id,
          userId,
          passedCount,
          total: totalTests,
          details: results,
          accepted,
        });

        if (duel.players.size >= 2 && duel.submissions.size >= 2) {
          finalizeDuel(id); // async, no need to await
        }

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
      } catch (err) {
        console.error("duel_submit_code error", err);
        ack({ ok: false, message: err.message || "server error" });
      }
    });

    // ---------- DISCONNECT ----------
    socket.on("disconnect", () => {
      console.log("socket disconnected", socket.id);
      lastSubmitAt.delete(socket.id);

      const info = socketToPlayer.get(socket.id);
      socketToPlayer.delete(socket.id);
      if (!info) return;

      const { duelId, userId } = info;
      const duel = duels.get(duelId);
      if (!duel) return;

      duel.players.delete(userId);

      if (duel.players.size === 0) {
        console.log("All players left duel; deleting duel", duelId);
        if (duel.timers.ttlTimer) clearTimeout(duel.timers.ttlTimer);
        duels.delete(duelId);
        return;
      }

      const playersArr = Array.from(duel.players).map((uid) => ({ id: uid }));
      io.to(duelId).emit("room_update", {
        players: playersArr,
        started: !!duel.startedAt,
      });
    });
  });
};
