// server/socket.js
const jwt = require("jsonwebtoken");
const axios = require("axios");
const Problem = require("./models/Problem");
const User = require("./models/User");
const Duel = require("./models/Duel");
const DuelMatch = require("./models/DuelMatch"); // optional history model

let runSubmission, getLanguageId;

try {
  // preferred: use centralized judge util if present
  ({ runSubmission, getLanguageId } = require("./utils/judge0"));
} catch (e) {
  // fallback: call local /submissions/run endpoint
  const API_BASE =
    process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`;
  runSubmission = async ({ source, languageId, stdin }) => {
    const language = languageId; // pass through for fallback endpoint which may accept 'language'
    const resp = await axios.post(
      `${API_BASE}/submissions/run`,
      { code: source, language, input: stdin },
      { timeout: 60000 }
    );
    return resp.data;
  };
  getLanguageId = (lang) => lang;
}

const rooms = new Map(); // roomId -> room state

function makeRoomId() {
  return Math.random().toString(36).slice(2, 8);
}

// simple elo-like rating update (same logic as existing /duels/finish)
function updateRatings(ratingA, ratingB, result) {
  const K = 30;
  const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  const expectedB = 1 / (1 + Math.pow(10, (ratingA - ratingB) / 400));

  let scoreA, scoreB;
  if (result === "A") {
    scoreA = 1;
    scoreB = 0;
  } else if (result === "B") {
    scoreA = 0;
    scoreB = 1;
  } else {
    scoreA = 0.5;
    scoreB = 0.5;
  }

  const newA = Math.round(ratingA + K * (scoreA - expectedA));
  const newB = Math.round(ratingB + K * (scoreB - expectedB));
  return { newA, newB };
}

// richer problem shape for duel room UI
function sanitizeProblem(p) {
  if (!p) return null;
  return {
    _id: p._id,
    slug: p.slug,
    title: p.title,
    description: p.description,
    difficulty: p.difficulty,

    // extra fields to make duel problem look like normal problem page
    examples: p.examples || [], // [{ input, output, explanation }]
    inputFormat: p.inputFormat || p.input_description,
    outputFormat: p.outputFormat || p.output_description,
    constraints: p.constraints || p.constraintsText,
    tags: p.tags || [],
  };
}

function now() {
  return Date.now();
}

async function initSockets(io) {
  io.on("connection", async (socket) => {
    try {
      // authenticate socket via token passed in auth or query
      const token =
        (socket.handshake.auth && socket.handshake.auth.token) ||
        (socket.handshake.query && socket.handshake.query.token);
      if (!token) {
        socket.emit("duel_error", { message: "Authentication required" });
        return socket.disconnect(true);
      }

      let payload;
      try {
        payload = jwt.verify(token, process.env.JWT_SECRET || "secret");
      } catch (e) {
        socket.emit("duel_error", { message: "Invalid token" });
        return socket.disconnect(true);
      }

      // support different payload shapes: { id }, { userId }, { _id }, { sub }
      const userId =
        payload.id || payload.userId || payload._id || payload.sub;
      if (!userId) {
        socket.emit("duel_error", { message: "Invalid token payload" });
        return socket.disconnect(true);
      }

      const user = await User.findById(userId).select(
        "name username avatarUrl rating"
      );
      if (!user) {
        socket.emit("duel_error", { message: "User not found" });
        return socket.disconnect(true);
      }

      socket.user = {
        id: user._id.toString(),
        name: user.name || user.username,
        username: user.username,
        avatarUrl: user.avatarUrl,
        rating: user.rating || 1500,
      };

      // per-socket submission throttle map
      socket._lastSubmissions = []; // timestamps

      function listPlayers(room) {
        return Array.from(room.playerOrder).map((sockId, idx) => {
          const p = room.players.get(sockId);
          return {
            slot: idx === 0 ? "A" : "B",
            id: p.id,
            name: p.name,
            username: p.username,
            avatarUrl: p.avatarUrl,
            rating: p.rating,
          };
        });
      }

      // create a duel room (allows client-provided roomId)
      socket.on(
        "create_duel",
        async (
          { roomId: clientRoomId, timeLimit = 600, difficulty = null } = {},
          cb
        ) => {
          const roomId = clientRoomId || makeRoomId();
          const room = {
            id: roomId,
            players: new Map(), // socketId -> user
            playerOrder: [], // socket ids order (first is A)
            started: false,
            problem: null,
            startAt: null,
            timeLimit: parseInt(timeLimit, 10) || 600,
            difficulty: difficulty || null,
            submissions: [], // array of { socketId, accepted, passedTests, totalTests, timeMs, attemptAt, penaltyCount }
            winner: null,
            timer: null,
          };
          room.players.set(socket.id, socket.user);
          room.playerOrder.push(socket.id);
          rooms.set(roomId, room);
          socket.join(roomId);
          if (cb) cb({ ok: true, roomId });
          io.to(roomId).emit("room_update", {
            roomId,
            players: listPlayers(room),
            started: room.started,
          });
        }
      );

      // join existing room
      socket.on("join_duel", async ({ roomId }, cb) => {
        const room = rooms.get(roomId);
        if (!room) {
          if (cb) cb({ ok: false, message: "Room not found" });
          return;
        }
        if (room.players.size >= 2) {
          if (cb) cb({ ok: false, message: "Room full" });
          return;
        }
        room.players.set(socket.id, socket.user);
        room.playerOrder.push(socket.id);
        socket.join(roomId);
        if (cb) cb({ ok: true, roomId });
        io.to(roomId).emit("room_update", {
          roomId,
          players: listPlayers(room),
          started: room.started,
        });
      });

      // leave room
      socket.on("leave_duel", ({ roomId } = {}) => {
        const room = rooms.get(roomId);
        if (!room) return;
        room.players.delete(socket.id);
        room.playerOrder = room.playerOrder.filter((s) => s !== socket.id);
        socket.leave(roomId);
        // if someone leaves during an active duel, end duel and award other player
        if (room.started && !room.winner) {
          // if only one player left -> other wins
          if (room.players.size === 1) {
            const remainingSockId =
              room.playerOrder[0] || Array.from(room.players.keys())[0];
            const winnerSlot =
              remainingSockId === room.playerOrder[0] ? "A" : "B";
            endDuel(roomId, winnerSlot, "opponent_left").catch((err) =>
              console.error(err)
            );
          }
        }
        if (room.players.size === 0) rooms.delete(roomId);
        else
          io.to(roomId).emit("room_update", {
            roomId,
            players: listPlayers(room),
            started: room.started,
          });
      });

      // start duel (only host — first player — may start)
      socket.on("start_duel", async ({ roomId }, cb) => {
        const room = rooms.get(roomId);
        if (!room) {
          if (cb) cb({ ok: false, message: "Room not found" });
          return;
        }
        // host check
        const hostId = room.playerOrder[0];
        if (hostId !== socket.id) {
          if (cb) cb({ ok: false, message: "Only room creator can start" });
          return;
        }
        if (room.players.size < 2) {
          if (cb) cb({ ok: false, message: "Need 2 players to start" });
          return;
        }
        if (room.started) {
          if (cb) cb({ ok: false, message: "Duel already started" });
          return;
        }

        // choose problem: prefer same difficulty if set, else random
        let query = [];
        if (room.difficulty) query.push({ difficulty: room.difficulty });
        try {
          const sample = await Problem.aggregate([
            { $match: query.length ? { $or: query } : {} },
            { $sample: { size: 1 } },
          ]);
          const problem = sample && sample[0] ? sample[0] : null;
          room.problem = sanitizeProblem(problem);
        } catch (err) {
          console.warn("Problem selection failed", err);
          room.problem = null;
        }

        room.started = true;
        room.startAt = now();
        room.winner = null;
        rooms.set(roomId, room);

        // schedule end-of-duel timer
        clearTimeout(room.timer);
        room.timer = setTimeout(() => {
          // decide winner by fallback rules when time runs out
          decideWinnerByFallback(roomId).catch((e) =>
            console.error("decideWinnerByFallback err", e)
          );
        }, room.timeLimit * 1000);

        io.to(roomId).emit("duel_started", {
          roomId,
          problem: room.problem,
          startedAt: room.startAt,
          timeLimit: room.timeLimit,
        });
        if (cb) cb({ ok: true });
      });

      // server-side run: client sends source+language+stdin, server runs via Judge0 and evaluates
      socket.on(
        "duel_submit_code",
        async ({ roomId, source, language, stdin }, cb) => {
          const room = rooms.get(roomId);
          if (!room) {
            if (cb) cb({ ok: false, message: "Room not found" });
            return;
          }
          if (!room.started) {
            if (cb) cb({ ok: false, message: "Duel not started" });
            return;
          }
          if (room.winner) {
            if (cb) cb({ ok: false, message: "Duel already finished" });
            return;
          }

          // throttle: limit 6 submissions per minute per socket
          const tsNow = Date.now();
          socket._lastSubmissions = socket._lastSubmissions.filter(
            (t) => tsNow - t < 60_000
          );
          if (
            socket._lastSubmissions.length >=
            parseInt(process.env.DUEL_SUBMIT_MAX_PER_MIN || "6", 10)
          ) {
            if (cb)
              cb({ ok: false, message: "Too many submissions, slow down" });
            return;
          }
          socket._lastSubmissions.push(tsNow);

          // run via judge
          let judgeResult;
          try {
            const languageId = getLanguageId
              ? getLanguageId(language)
              : language;
            judgeResult = await runSubmission({
              source,
              languageId,
              stdin: stdin || "",
            });
          } catch (err) {
            console.error(
              "Judge run error:",
              err.response?.data || err.message || err
            );
            if (cb) cb({ ok: false, message: "Error running code" });
            return;
          }

          // interpret judge response
          // common Judge0 structure: { status: { id, description }, stdout, stderr, ...) }
          const statusDesc =
            (judgeResult.status && judgeResult.status.description) ||
            judgeResult.result ||
            "";
          const accepted =
            String(statusDesc).toLowerCase().includes("accepted") ||
            judgeResult.status?.id === 3;
          const passedTests =
            judgeResult.passedTests ?? judgeResult.stats?.passed ?? null;
          const totalTests =
            judgeResult.totalTests ?? judgeResult.stats?.total ?? null;
          const timeMs = judgeResult.time ?? null;

          // record attempt
          const attempt = {
            socketId: socket.id,
            user: socket.user,
            accepted,
            passedTests,
            totalTests,
            timeMs,
            attemptAt: now(),
            penaltyCount: accepted ? 0 : 1, // simple penalty: non-AC attempt = 1
            raw: {
              status: statusDesc,
              stdout: judgeResult.stdout,
              stderr: judgeResult.stderr,
            },
          };
          room.submissions.push(attempt);

          // broadcast attempt summary
          io.to(roomId).emit("duel_submission_update", {
            roomId,
            attempt: {
              user: { id: socket.user.id, name: socket.user.name },
              accepted,
              passedTests,
              totalTests,
              timeMs,
              attemptAt: attempt.attemptAt,
            },
          });

          // immediate win on accepted (first-AC)
          if (accepted && !room.winner) {
            // determine winner slot (A/B) by playerOrder
            const winnerSlot =
              room.playerOrder[0] === socket.id ? "A" : "B";
            await endDuel(roomId, winnerSlot, "first_ac");
            if (cb) cb({ ok: true, accepted: true, judge: judgeResult });
            return;
          }

          if (cb) cb({ ok: true, accepted: false, judge: judgeResult });
        }
      );

      socket.on("disconnect", () => {
        // remove from rooms and notify
        for (const [roomId, room] of rooms.entries()) {
          if (room.players.has(socket.id)) {
            room.players.delete(socket.id);
            room.playerOrder = room.playerOrder.filter(
              (s) => s !== socket.id
            );
            io.to(roomId).emit("room_update", {
              roomId,
              players: listPlayers(room),
              started: room.started,
            });
            // if duel active and one left -> award remaining
            if (
              room.started &&
              !room.winner &&
              room.players.size === 1
            ) {
              const remainingSockId =
                room.playerOrder[0] ||
                Array.from(room.players.keys())[0];
              const winnerSlot =
                remainingSockId === room.playerOrder[0] ? "A" : "B";
              endDuel(roomId, winnerSlot, "opponent_disconnect").catch(
                (e) => console.error(e)
              );
            }
            if (room.players.size === 0) {
              clearTimeout(room.timer);
              rooms.delete(roomId);
            }
          }
        }
      });

      // Helper: compute winner when time expires or forced end
      async function decideWinnerByFallback(roomId) {
        const room = rooms.get(roomId);
        if (!room || room.winner) return;
        // compute best attempt per player: prefer max passedTests, tie-breaker fewer penalties, earliest attempt time
        const bestBySocket = {};
        for (const s of room.playerOrder)
          bestBySocket[s] = {
            passedTests: -1,
            penalties: 9999,
            attemptAt: Infinity,
            accepted: false,
          };
        for (const a of room.submissions) {
          const cur = bestBySocket[a.socketId];
          if (!cur) continue;
          const passed =
            typeof a.passedTests === "number"
              ? a.passedTests
              : a.accepted
              ? a.totalTests || 0
              : cur.passedTests;
          const penalties = (cur.penalties || 0) + (a.penaltyCount || 0);
          const better =
            (a.accepted && !cur.accepted) ||
            passed > cur.passedTests ||
            (passed === cur.passedTests &&
              a.penaltyCount < (cur.penaltyCount || 9999)) ||
            (passed === cur.passedTests &&
              a.penaltyCount === (cur.penaltyCount || 9999) &&
              a.attemptAt < cur.attemptAt);
          if (better) {
            bestBySocket[a.socketId] = {
              passedTests: passed,
              penalties: a.penaltyCount || 0,
              attemptAt: a.attemptAt,
              accepted: a.accepted,
            };
          }
        }
        // Map players to A/B
        const sockA = room.playerOrder[0];
        const sockB = room.playerOrder[1];
        const aBest = bestBySocket[sockA] || null;
        const bBest = bestBySocket[sockB] || null;

        let winnerSlot = null;
        if (aBest && bBest) {
          if (aBest.accepted && !bBest.accepted) winnerSlot = "A";
          else if (bBest.accepted && !aBest.accepted) winnerSlot = "B";
          else {
            // compare passedTests
            const aPassed = aBest.passedTests || 0;
            const bPassed = bBest.passedTests || 0;
            if (aPassed > bPassed) winnerSlot = "A";
            else if (bPassed > aPassed) winnerSlot = "B";
            else {
              // fewer penalties
              const aPenalty = aBest.penalties || 0;
              const bPenalty = bBest.penalties || 0;
              if (aPenalty < bPenalty) winnerSlot = "A";
              else if (bPenalty < aPenalty) winnerSlot = "B";
              else {
                // earliest best attempt
                if ((aBest.attemptAt || Infinity) < (bBest.attemptAt || Infinity))
                  winnerSlot = "A";
                else if (
                  (bBest.attemptAt || Infinity) <
                  (aBest.attemptAt || Infinity)
                )
                  winnerSlot = "B";
                else winnerSlot = "draw";
              }
            }
          }
        } else if (aBest && !bBest) winnerSlot = "A";
        else if (bBest && !aBest) winnerSlot = "B";
        else winnerSlot = "draw";

        await endDuel(roomId, winnerSlot, "time_up");
      }

      // Helper: finalize duel, persist and announce
      async function endDuel(roomId, winnerSlot, reason) {
        const room = rooms.get(roomId);
        if (!room || room.winner) return;
        room.winner = winnerSlot;
        clearTimeout(room.timer);

        // gather players
        const sockA = room.playerOrder[0];
        const sockB = room.playerOrder[1];
        const userA = room.players.get(sockA);
        const userB = room.players.get(sockB);

        // persist Duel document (if both users present)
        try {
          if (userA && userB) {
            let winnerEnum =
              winnerSlot === "A"
                ? "A"
                : winnerSlot === "B"
                ? "B"
                : "draw";
            await Duel.create({
              playerA: userA.id,
              playerB: userB.id,
              winner: winnerEnum,
              problem: room.problem?._id || null,
              durationSeconds: Math.max(
                0,
                Math.floor((now() - room.startAt) / 1000)
              ),
              roomId: room.id,
            });

            // update ratings (use same logic as /duels/finish)
            const playerARecord = await User.findById(userA.id);
            const playerBRecord = await User.findById(userB.id);
            const oldA = playerARecord.rating || 1500;
            const oldB = playerBRecord.rating || 1500;
            const { newA, newB } = updateRatings(oldA, oldB, winnerSlot);

            const incA = {};
            const incB = {};
            if (winnerSlot === "A") (incA.duelWins = 1), (incB.duelLosses = 1);
            else if (winnerSlot === "B")
              (incB.duelWins = 1), (incA.duelLosses = 1);

            await User.findByIdAndUpdate(userA.id, {
              $set: { rating: newA },
              $inc: incA,
            });
            await User.findByIdAndUpdate(userB.id, {
              $set: { rating: newB },
              $inc: incB,
            });
          }
        } catch (err) {
          console.error("Error persisting duel:", err);
        }

        rooms.set(roomId, room);

        // notify room
        io.to(roomId).emit("duel_ended", {
          roomId,
          winner: winnerSlot,
          reason,
          finishedAt: now(),
          summary: {
            submissions: room.submissions.map((s) => ({
              user: s.user && { id: s.user.id, name: s.user.name },
              accepted: s.accepted,
              passedTests: s.passedTests,
              totalTests: s.totalTests,
              timeMs: s.timeMs,
              attemptAt: s.attemptAt,
            })),
          },
        });

        // cleanup after short delay
        setTimeout(() => {
          try {
            rooms.delete(roomId);
          } catch (err) {
            console.error("Room cleanup error", err);
          }
        }, 5000);
      }
    } catch (err) {
      console.error("Socket init error", err);
    }
  });
}

module.exports = { initSockets };
