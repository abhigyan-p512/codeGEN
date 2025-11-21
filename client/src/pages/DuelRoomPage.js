// client/src/pages/DuelRoomPage.js
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { createDuelSocket } from "../utils/duelSocket";
import SimpleCodeEditor from "../components/SimpleCodeEditor";

function formatSeconds(sec) {
  if (sec == null || Number.isNaN(sec)) return "00:00";
  if (sec <= 0) return "00:00";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) {
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m.toString().padStart(2, "0")}:${s
    .toString()
    .padStart(2, "0")}`;
}

function difficultyBadgeMeta(difficulty) {
  const d = (difficulty || "").toLowerCase();
  if (d === "easy")
    return {
      text: "Easy",
      bg: "rgba(22,163,74,0.18)",
      border: "#16a34a",
      color: "#4ade80",
    };
  if (d === "medium")
    return {
      text: "Medium",
      bg: "rgba(245,158,11,0.18)",
      border: "#f59e0b",
      color: "#fbbf24",
    };
  if (d === "hard")
    return {
      text: "Hard",
      bg: "rgba(239,68,68,0.18)",
      border: "#ef4444",
      color: "#f87171",
    };
  return null;
}

function problemText(problem) {
  if (!problem) return "";
  return (
    problem.description ||
    problem.statement ||
    problem.body ||
    problem.content ||
    ""
  );
}

const defaultCode = `// Welcome to CodeGen4Future!
// Start coding here...

function helloWorld() {
  console.log("Hello, World!");
  return "Welcome to coding!";
}

// Run your code and see the output below
helloWorld();`;

function DuelRoomPage() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, token: ctxToken } = useAuth();

  // try multiple places for token
  const token = ctxToken || user?.token || localStorage.getItem("token");

  const isHost = location.state?.isHost ?? false;

  const [socket, setSocket] = useState(null);
  const [connecting, setConnecting] = useState(true);
  const [connError, setConnError] = useState("");

  const [players, setPlayers] = useState([]);
  const [duelStarted, setDuelStarted] = useState(false);
  const [duelEnded, setDuelEnded] = useState(false);
  const [winnerSlot, setWinnerSlot] = useState(null);
  const [endReason, setEndReason] = useState("");
  const [submissions, setSubmissions] = useState([]);

  const [timeLimit, setTimeLimit] = useState(null);
  const [startAt, setStartAt] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);

  const [problem, setProblem] = useState(null);

  const [code, setCode] = useState(defaultCode);
  const [language, setLanguage] = useState("javascript");
  const [stdin, setStdin] = useState("");
  const [runStatus, setRunStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // redirect if not logged in
  useEffect(() => {
    if (!user || !token) {
      navigate("/login", {
        state: {
          from: `/duel-room/${roomId}`,
          message: "You must be logged in to join a duel",
        },
      });
    }
  }, [user, token, navigate, roomId]);

  // init socket + room join / create
  useEffect(() => {
    if (!token) return;

    const s = createDuelSocket(token);
    setSocket(s);
    setConnecting(true);
    setConnError("");

    s.on("connect", () => {
      setConnecting(false);
      setConnError("");

      if (isHost) {
        s.emit(
          "create_duel",
          { roomId, timeLimit: 600 },
          (resp) => {
            if (!resp?.ok) {
              setConnError(resp?.message || "Failed to create room");
            }
          }
        );
      } else {
        s.emit("join_duel", { roomId }, (resp) => {
          if (!resp?.ok) {
            setConnError(resp?.message || "Failed to join room");
          }
        });
      }
    });

    s.on("disconnect", () => {
      setConnError("Disconnected from server");
    });

    s.on("duel_error", (payload) => {
      setConnError(payload?.message || "Duel error");
    });

    s.on("room_update", ({ players: p, started }) => {
      setPlayers(p || []);
      setDuelStarted(!!started);
    });

    s.on("duel_started", ({ problem, startedAt, timeLimit }) => {
      setProblem(problem || null);
      setStartAt(startedAt || Date.now());
      setTimeLimit(timeLimit || 600);
      setDuelStarted(true);
      setDuelEnded(false);
      setWinnerSlot(null);
      setEndReason("");
      setSubmissions([]);
      setRunStatus("");
    });

    s.on("duel_submission_update", ({ attempt }) => {
      if (!attempt) return;
      setSubmissions((prev) => [...prev, attempt]);
    });

    s.on("duel_ended", ({ winner, reason, summary }) => {
      setDuelEnded(true);
      setWinnerSlot(winner || null);
      setEndReason(reason || "");
      if (summary?.submissions) {
        setSubmissions(summary.submissions);
      }
      setTimeLeft(0);
    });

    return () => {
      s.emit("leave_duel", { roomId });
      s.removeAllListeners();
      s.disconnect();
    };
  }, [token, roomId, isHost]);

  // countdown timer
  useEffect(() => {
    if (!duelStarted || duelEnded || !startAt || !timeLimit) return;

    const tick = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - startAt) / 1000);
      const remaining = Math.max(timeLimit - elapsed, 0);
      setTimeLeft(remaining);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [duelStarted, duelEnded, startAt, timeLimit]);

  const myId = user?._id || user?.id;
  const me = useMemo(
    () => players.find((p) => p.id === myId),
    [players, myId]
  );
  const opponent = useMemo(
    () => players.find((p) => p.id !== myId),
    [players, myId]
  );

  const statusText = useMemo(() => {
    if (connError) return "Error";
    if (connecting) return "Connecting…";
    if (!duelStarted) return "Waiting for players / host to start";
    if (duelEnded) return "Duel finished";
    return "Duel in progress";
  }, [connError, connecting, duelStarted, duelEnded]);

  const badge = difficultyBadgeMeta(problem?.difficulty);
  const pText = problemText(problem);
  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(pText || "");
  const examples = problem?.examples || [];
  const hasIO =
    problem?.inputFormat || problem?.outputFormat || problem?.constraints;

  const handleStart = () => {
    if (!socket) return;
    socket.emit("start_duel", { roomId }, (resp) => {
      if (!resp?.ok) {
        setConnError(resp?.message || "Failed to start duel");
      }
    });
  };

  const handleUseExampleInput = (input) => {
    if (!input) return;
    setStdin(input);
    const el = document.getElementById("duel-editor-section");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSubmit = () => {
    if (!socket || !duelStarted || duelEnded) return;
    setIsSubmitting(true);
    setRunStatus("");

    socket.emit(
      "duel_submit_code",
      { roomId, source: code, language, stdin },
      (resp) => {
        setIsSubmitting(false);
        if (!resp?.ok) {
          setRunStatus(resp?.message || "Submission failed");
          return;
        }
        const accepted = resp.accepted;
        const statusDesc =
          resp.judge?.status?.description ||
          resp.judge?.result ||
          (accepted ? "Accepted" : "Not accepted");
        setRunStatus(
          accepted
            ? `✅ Accepted – ${statusDesc}`
            : `⚠️ Not accepted – ${statusDesc}`
        );
      }
    );
  };

  return (
    <div className="page-container">
      <div
        className="page-card"
        style={{
          borderRadius: 28,
          padding: 26,
          border: "1px solid #111827",
          background:
            "radial-gradient(circle at top, rgba(168,85,247,0.16), transparent 60%), #050509",
          boxShadow: "0 28px 90px rgba(0,0,0,0.95)",
        }}
      >
        {/* Header */}
        <div
          style={{
            marginBottom: 18,
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <h1 className="page-heading" style={{ marginBottom: 0 }}>
            1v1 Duel Room
          </h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>
            Room ID: <strong>{roomId}</strong> — share this with your opponent.
            First to solve wins, or server decides when the timer expires.
          </p>
        </div>

        {/* Error banner */}
        {connError && (
          <div
            style={{
              marginBottom: 14,
              padding: 10,
              borderRadius: 12,
              background: "rgba(127,29,29,0.9)",
              border: "1px solid rgba(248,113,113,0.7)",
              fontSize: 13,
              color: "#fee2e2",
            }}
          >
            {connError}
          </div>
        )}

        {/* Scoreboard row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 18,
            marginBottom: 22,
          }}
        >
          {/* You */}
          <div
            style={{
              padding: 18,
              borderRadius: 22,
              border: "1px solid rgba(34,197,94,0.7)",
              background:
                "radial-gradient(circle at top, rgba(22,163,74,0.25), transparent 60%), #020617",
              boxShadow: "0 18px 45px rgba(0,0,0,0.9)",
            }}
          >
            <h3
              style={{
                fontSize: 16,
                fontWeight: 600,
                marginBottom: 4,
                color: "#bbf7d0",
              }}
            >
              You
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: "#a7f3d0" }}>
              {me ? me.username || me.name : "Waiting..."}
            </p>
            <p
              style={{
                fontSize: 28,
                fontWeight: 800,
                margin: "8px 0 6px",
              }}
            >
              {me?.rating ?? "—"}
            </p>
            <p
              style={{
                fontSize: 11,
                color: "#bbf7d0",
                opacity: 0.8,
              }}
            >
              Rating
            </p>
          </div>

          {/* Timer */}
          <div
            style={{
              padding: 18,
              borderRadius: 22,
              border: "1px solid rgba(59,130,246,0.7)",
              background:
                "radial-gradient(circle at top, rgba(59,130,246,0.25), transparent 60%), #020617",
              textAlign: "center",
              boxShadow: "0 18px 45px rgba(0,0,0,0.9)",
            }}
          >
            <div
              style={{
                fontSize: 13,
                color: "#cbd5f5",
                marginBottom: 4,
              }}
            >
              {statusText}
            </div>
            <div
              style={{
                fontSize: 32,
                fontWeight: 700,
                letterSpacing: 2,
                marginBottom: 10,
              }}
            >
              {formatSeconds(timeLeft)}
            </div>
            {isHost && !duelStarted && !duelEnded && (
              <button
                className="btn btn-primary"
                onClick={handleStart}
                disabled={connecting || !!connError || players.length < 2}
              >
                {players.length < 2 ? "Waiting for opponent…" : "Start Duel"}
              </button>
            )}
            {!isHost && !duelStarted && !duelEnded && (
              <p
                style={{
                  fontSize: 12,
                  color: "#cbd5f5",
                  marginTop: 4,
                }}
              >
                Waiting for host to start…
              </p>
            )}
          </div>

          {/* Opponent */}
          <div
            style={{
              padding: 18,
              borderRadius: 22,
              border: "1px solid rgba(248,250,252,0.12)",
              background:
                "radial-gradient(circle at top, rgba(248,250,252,0.1), transparent 60%), #020617",
              boxShadow: "0 18px 45px rgba(0,0,0,0.9)",
            }}
          >
            <h3
              style={{
                fontSize: 16,
                fontWeight: 600,
                marginBottom: 4,
                color: "#e5e7eb",
              }}
            >
              Opponent
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: "#e5e7eb" }}>
              {opponent ? opponent.username || opponent.name : "Waiting..."}
            </p>
            <p
              style={{
                fontSize: 28,
                fontWeight: 800,
                margin: "8px 0 6px",
              }}
            >
              {opponent?.rating ?? "—"}
            </p>
            <p
              style={{
                fontSize: 11,
                color: "#9ca3af",
                opacity: 0.85,
              }}
            >
              Rating
            </p>
          </div>
        </div>

        {/* Result banner */}
        {duelEnded && (
          <div
            style={{
              marginBottom: 18,
              padding: 10,
              borderRadius: 12,
              background: "rgba(15,23,42,0.9)",
              border: "1px solid rgba(148,163,184,0.5)",
              fontSize: "0.9rem",
            }}
          >
            {winnerSlot === null || winnerSlot === "draw"
              ? "Duel finished: draw."
              : winnerSlot === (me?.slot || "")
              ? "Duel finished: You won! 🎉"
              : "Duel finished: Opponent won."}
            {endReason && (
              <span style={{ opacity: 0.85 }}>
                {" "}
                (Reason: <code>{endReason}</code>)
              </span>
            )}
          </div>
        )}

        {/* Submission activity */}
        {submissions.length > 0 && (
          <div
            style={{
              marginBottom: 18,
              padding: 10,
              borderRadius: 12,
              background: "rgba(15,23,42,0.88)",
              border: "1px solid rgba(55,65,81,0.8)",
              maxHeight: 140,
              overflowY: "auto",
              fontSize: 12,
            }}
          >
            <div
              style={{
                marginBottom: 6,
                fontWeight: 600,
                fontSize: 13,
                color: "#e5e7eb",
              }}
            >
              Submission activity
            </div>
            {submissions.map((a, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 8,
                  padding: "2px 0",
                }}
              >
                <span>
                  <strong>{a.user?.name || "Player"}</strong>{" "}
                  {a.accepted ? (
                    <span style={{ color: "#4ade80" }}>Accepted</span>
                  ) : (
                    <span style={{ color: "#fbbf24" }}>Not accepted</span>
                  )}
                </span>
                <span style={{ opacity: 0.8 }}>
                  {typeof a.passedTests === "number" &&
                  typeof a.totalTests === "number"
                    ? `${a.passedTests}/${a.totalTests} tests`
                    : null}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* MAIN 2-COLUMN AREA: Problem (left) + Editor (right) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.05fr) minmax(0, 1fr)",
            gap: 22,
            alignItems: "flex-start",
          }}
        >
          {/* LEFT: Battle Problem -> looks like normal problem page */}
          <div>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              Battle Problem
            </h2>

            <div
              style={{
                padding: 18,
                borderRadius: 20,
                background: "rgba(15,23,42,0.98)",
                border: "1px solid #111827",
                minHeight: 220,
                maxHeight: 640,
                overflowY: "auto",
              }}
            >
              {!duelStarted && !problem && (
                <p style={{ fontSize: 13, color: "#9ca3af" }}>
                  Problem will appear here once the duel starts.
                </p>
              )}

              {problem && (
                <>
                  {/* Title + difficulty */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      marginBottom: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <h2
                      style={{
                        fontSize: 22,
                        fontWeight: 700,
                        margin: 0,
                        color: "#e5e7eb",
                      }}
                    >
                      {problem.title || "Untitled problem"}
                    </h2>
                    {badge && (
                      <span
                        style={{
                          padding: "3px 12px",
                          borderRadius: 999,
                          background: badge.bg,
                          border: `1px solid ${badge.border}`,
                          color: badge.color,
                          fontSize: 11,
                          textTransform: "uppercase",
                          letterSpacing: 0.08,
                        }}
                      >
                        {badge.text}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <div style={{ marginBottom: 16 }}>
                    <h3
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        marginBottom: 4,
                        color: "#e5e7eb",
                      }}
                    >
                      Description
                    </h3>
                    {pText ? (
                      looksLikeHtml ? (
                        <div
                          style={{
                            fontSize: 13,
                            color: "#e5e7eb",
                            lineHeight: 1.6,
                          }}
                          dangerouslySetInnerHTML={{ __html: pText }}
                        />
                      ) : (
                        <p
                          style={{
                            fontSize: 13,
                            color: "#e5e7eb",
                            lineHeight: 1.6,
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {pText}
                        </p>
                      )
                    ) : (
                      <p
                        style={{
                          fontSize: 13,
                          color: "#9ca3af",
                        }}
                      >
                        No description available.
                      </p>
                    )}
                  </div>

                  {/* Input / Output / Constraints */}
                  {hasIO && (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(170px, 1fr))",
                        gap: 16,
                        marginBottom: 16,
                      }}
                    >
                      {problem.inputFormat && (
                        <div>
                          <h4
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              marginBottom: 4,
                              color: "#e5e7eb",
                            }}
                          >
                            Input Format
                          </h4>
                          <p
                            style={{
                              fontSize: 13,
                              color: "#d1d5db",
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {problem.inputFormat}
                          </p>
                        </div>
                      )}
                      {problem.outputFormat && (
                        <div>
                          <h4
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              marginBottom: 4,
                              color: "#e5e7eb",
                            }}
                          >
                            Output Format
                          </h4>
                          <p
                            style={{
                              fontSize: 13,
                              color: "#d1d5db",
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {problem.outputFormat}
                          </p>
                        </div>
                      )}
                      {problem.constraints && (
                        <div>
                          <h4
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              marginBottom: 4,
                              color: "#e5e7eb",
                            }}
                          >
                            Constraints
                          </h4>
                          <pre
                            style={{
                              margin: 0,
                              padding: 10,
                              borderRadius: 10,
                              fontSize: 12,
                              background: "#020617",
                              border: "1px solid rgba(31,41,55,0.9)",
                              color: "#e5e7eb",
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {problem.constraints}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Examples with Use as Input */}
                  {examples.length > 0 && (
                    <div style={{ marginTop: 4 }}>
                      <h3
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          marginBottom: 8,
                          color: "#e5e7eb",
                        }}
                      >
                        Examples
                      </h3>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 12,
                        }}
                      >
                        {examples.map((ex, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: 12,
                              borderRadius: 14,
                              background: "#020617",
                              border: "1px solid rgba(31,41,55,0.95)",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: 6,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 13,
                                  fontWeight: 600,
                                  color: "#e5e7eb",
                                }}
                              >
                                Example {idx + 1}
                              </span>
                              <button
                                type="button"
                                className="btn btn-secondary"
                                style={{
                                  padding: "4px 10px",
                                  fontSize: 11,
                                  borderRadius: 999,
                                }}
                                onClick={() =>
                                  handleUseExampleInput(ex.input)
                                }
                              >
                                Use as Input
                              </button>
                            </div>

                            {ex.input && (
                              <div style={{ marginBottom: 6 }}>
                                <span
                                  style={{
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: "#a5b4fc",
                                  }}
                                >
                                  Input:
                                </span>
                                <pre
                                  style={{
                                    margin: 0,
                                    marginTop: 2,
                                    padding: 8,
                                    borderRadius: 8,
                                    fontSize: 12,
                                    background: "#020617",
                                    border:
                                      "1px solid rgba(30,64,175,0.7)",
                                    color: "#e5e7eb",
                                    whiteSpace: "pre-wrap",
                                  }}
                                >
                                  {ex.input}
                                </pre>
                              </div>
                            )}

                            {ex.output && (
                              <div style={{ marginBottom: 6 }}>
                                <span
                                  style={{
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: "#6ee7b7",
                                  }}
                                >
                                  Output:
                                </span>
                                <pre
                                  style={{
                                    margin: 0,
                                    marginTop: 2,
                                    padding: 8,
                                    borderRadius: 8,
                                    fontSize: 12,
                                    background: "#020617",
                                    border:
                                      "1px solid rgba(22,163,74,0.7)",
                                    color: "#e5e7eb",
                                    whiteSpace: "pre-wrap",
                                  }}
                                >
                                  {ex.output}
                                </pre>
                              </div>
                            )}

                            {ex.explanation && (
                              <div>
                                <span
                                  style={{
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: "#facc15",
                                  }}
                                >
                                  Explanation:
                                </span>
                                <p
                                  style={{
                                    margin: 0,
                                    marginTop: 2,
                                    fontSize: 12,
                                    color: "#e5e7eb",
                                  }}
                                >
                                  {ex.explanation}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* RIGHT: Your Code (re-using your SimpleCodeEditor layout) */}
          <div id="duel-editor-section">
            <h2
              style={{
                fontSize: 18,
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              Your Code
            </h2>

            <p
              style={{
                fontSize: 12,
                color: "#9ca3af",
                marginBottom: 10,
              }}
            >
              💡 Use the examples on the left and the custom input below to test
              your solution, then submit to the duel. First accepted solution
              wins.
            </p>

            <div
              style={{
                padding: 16,
                borderRadius: 20,
                background: "rgba(15,23,42,0.98)",
                border: "1px solid #111827",
              }}
            >
              {/* Top row: buttons + language */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  alignItems: "center",
                  marginBottom: 12,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {}} // regular "Run Code" handled by SimpleCodeEditor if you wired it
                    style={{ padding: "6px 16px", fontWeight: 600 }}
                  >
                    Run Code
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setCode(defaultCode)}
                    style={{ padding: "6px 14px", fontSize: 12 }}
                  >
                    Clear
                  </button>
                  {/* Copy & Download buttons are visual; you can wire them to your utilities */}
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: "6px 14px", fontSize: 12 }}
                    onClick={() => navigator.clipboard.writeText(code)}
                  >
                    Copy
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: "6px 14px", fontSize: 12 }}
                    onClick={() => {
                      const blob = new Blob([code], {
                        type: "text/plain;charset=utf-8",
                      });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "solution.txt";
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    Download
                  </button>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      color: "#e5e7eb",
                      fontWeight: 500,
                    }}
                  >
                    Language:
                  </span>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="input-control"
                    style={{
                      maxWidth: 160,
                      fontSize: 13,
                      paddingTop: 6,
                      paddingBottom: 6,
                    }}
                  >
                    <option value="cpp">C++</option>
                    <option value="c">C</option>
                    <option value="java">Java</option>
                    <option value="python">Python</option>
                    <option value="javascript">JavaScript</option>
                  </select>
                </div>
              </div>

              {/* Code editor + output (your SimpleCodeEditor handles layout) */}
              <div style={{ marginBottom: 12 }}>
                <SimpleCodeEditor
                  value={code}
                  onChange={setCode}
                  language={language}
                />
              </div>

              {/* stdin box */}
              <textarea
                className="input-control"
                rows={3}
                placeholder="Optional custom input (stdin)"
                value={stdin}
                onChange={(e) => setStdin(e.target.value)}
                style={{ marginBottom: 10, fontSize: 13 }}
              />

              {/* Duel submission */}
              <button
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={
                  isSubmitting ||
                  !duelStarted ||
                  duelEnded ||
                  !!connError ||
                  connecting
                }
                style={{ padding: "9px 18px", fontWeight: 600 }}
              >
                {isSubmitting ? "Running & Submitting…" : "Run & Submit to Duel"}
              </button>

              {runStatus && (
                <p
                  style={{
                    fontSize: 13,
                    marginTop: 8,
                    color: runStatus.startsWith("✅")
                      ? "#4ade80"
                      : "#e5e7eb",
                  }}
                >
                  {runStatus}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DuelRoomPage;
