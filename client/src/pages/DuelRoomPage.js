// client/src/pages/DuelRoomPage.js
import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import MonacoCodeRunner from "../components/MonacoCodeRunner";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import createDuelSocket from "../utils/duelSocket";

const DEFAULT_LANGUAGE = "python";

const styles = {
  page: {
    minHeight: "100vh",
    background: "#020617",
    color: "#e5e7eb",
    padding: "24px",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
  },
  titleBlock: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  title: {
    margin: 0,
    fontSize: "26px",
    fontWeight: 700,
  },
  status: {
    fontSize: "13px",
    opacity: 0.8,
  },
  substatus: {
    fontSize: "13px",
    opacity: 0.75,
  },
  main: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1.3fr)",
    gap: "18px",
    alignItems: "stretch",
  },
  problemPanel: {
    background: "#020617",
    borderRadius: "14px",
    padding: "16px",
    border: "1px solid #1f2937",
    boxShadow: "0 0 0 1px rgba(15, 23, 42, 0.6)",
    overflowY: "auto",
    maxHeight: "calc(100vh - 170px)",
  },
  problemTitle: {
    marginTop: 0,
    marginBottom: "8px",
    fontSize: "18px",
    fontWeight: 600,
  },
  problemDescription: {
    fontSize: "14px",
    lineHeight: 1.6,
    whiteSpace: "pre-wrap",
  },
  problemSubheading: {
    marginTop: "16px",
    marginBottom: "6px",
    fontSize: "14px",
    fontWeight: 600,
  },
  problemConstraints: {
    background: "#020617",
    borderRadius: "8px",
    border: "1px solid #1f2937",
    padding: "8px",
    fontSize: "13px",
    whiteSpace: "pre-wrap",
  },
  exampleBox: {
    marginBottom: "10px",
    padding: "8px",
    borderRadius: "8px",
    border: "1px solid #1f2937",
    background: "#020617",
  },
  exampleBlock: {
    marginBottom: "4px",
    fontSize: "13px",
  },
  examplePre: {
    margin: "4px 0 0",
    padding: "6px",
    borderRadius: "6px",
    background: "#020617",
    border: "1px solid #111827",
    fontSize: "12px",
    whiteSpace: "pre-wrap",
  },
  waitingProblemTitle: {
    margin: 0,
    marginBottom: "6px",
    fontSize: "16px",
    fontWeight: 600,
  },
  waitingProblemText: {
    fontSize: "14px",
    opacity: 0.8,
  },
  editorPanel: {
    background: "#020617",
    borderRadius: "14px",
    padding: "8px",
    border: "1px solid #1f2937",
    boxShadow: "0 0 0 1px rgba(15, 23, 42, 0.6)",
    maxHeight: "calc(100vh - 170px)",
    display: "flex",
    flexDirection: "column",
  },
  editorPanelChild: {
    flex: 1,
    minHeight: 0,
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexShrink: 0,
  },
  duelCodeText: {
    fontSize: "12px",
    opacity: 0.75,
  },
  buttonBase: {
    borderRadius: "9999px",
    padding: "6px 14px",
    fontSize: "13px",
    fontWeight: 500,
    border: "1px solid transparent",
    cursor: "pointer",
    outline: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    whiteSpace: "nowrap",
    transition:
      "background 0.15s ease, transform 0.05s ease, border-color 0.15s ease",
  },
  startButton: {
    background:
      "linear-gradient(90deg, rgba(129,140,248,1) 0%, rgba(236,72,153,1) 100%)",
    borderColor: "rgba(129,140,248,0.4)",
    color: "#0b1020",
  },
  startButtonDisabled: {
    opacity: 0.6,
    cursor: "default",
  },
  copyButton: {
    background: "#020617",
    borderColor: "#334155",
    color: "#e5e7eb",
  },

  // Winner / loser banner
  resultBanner: {
    marginTop: "6px",
    padding: "8px 12px",
    borderRadius: "9999px",
    fontSize: "13px",
    fontWeight: 500,
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
  },
  resultWin: {
    background: "rgba(34,197,94,0.1)",
    border: "1px solid rgba(34,197,94,0.4)",
    color: "#bbf7d0",
  },
  resultLose: {
    background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.4)",
    color: "#fecaca",
  },
  resultDraw: {
    background: "rgba(148,163,184,0.15)",
    border: "1px solid rgba(148,163,184,0.4)",
    color: "#e5e7eb",
  },
  resultSummary: {
    marginTop: "4px",
    fontSize: "12px",
    opacity: 0.85,
  },
  resultRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "8px",
  },
};

export default function DuelRoomPage() {
  const { roomId } = useParams();
  const { user } = useAuth();

  const [socket, setSocket] = useState(null);
  const [problem, setProblem] = useState(null);
  const [status, setStatus] = useState("Waiting to start");
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const [code, setCode] = useState("");
  const [runOutput, setRunOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [copyLabel, setCopyLabel] = useState("Copy duel code");

  const [players, setPlayers] = useState([]);
  const [isHost, setIsHost] = useState(false);

  // NEW: winner/loser/draw + summary
  const [duelOutcome, setDuelOutcome] = useState(null); // "win" | "lose" | "draw" | null
  const [duelSummary, setDuelSummary] = useState(null);

  // -------- SOCKET SETUP + JOIN in ONE EFFECT --------
  useEffect(() => {
    if (!roomId) return;

    const s = createDuelSocket();
    setSocket(s);

    const handleDuelStarted = (payload) => {
      console.log("duel_started payload", payload);
      if (payload?.problem) setProblem(payload.problem);
      setStatus("Duel in progress");
      setHasStarted(true);

      // reset outcome when a new duel starts
      setDuelOutcome(null);
      setDuelSummary(null);
    };

    const handleDuelError = (err) => {
      console.log("duel_error", err);
      setStatus(err?.message || "Duel error");
      setHasStarted(false);
    };

    const handleDuelFinished = (payload) => {
      console.log("duel_finished", payload);
      if (!payload) return;

      const { winner, summary } = payload;
      const myId = user?._id || user?.id || null;

      let outcome = "draw";
      if (winner) {
        if (myId && String(winner) === String(myId)) {
          outcome = "win";
        } else {
          outcome = "lose";
        }
      }

      if (outcome === "win") {
        setStatus("Duel finished – you won! 🏆");
      } else if (outcome === "lose") {
        setStatus("Duel finished – you lost ❌");
      } else {
        setStatus("Duel finished – draw 🤝");
      }

      setDuelOutcome(outcome);
      setDuelSummary(summary || null);
      setHasStarted(false);
    };

    const handleRoomUpdate = ({ players = [], started } = {}) => {
      console.log("room_update", players, started);
      setPlayers(players);
      setHasStarted(!!started);
    };

    const handleRole = ({ isHost }) => {
      console.log("duel_role", isHost);
      setIsHost(!!isHost);
    };

    s.on("duel_started", handleDuelStarted);
    s.on("duel_error", handleDuelError);
    s.on("duel_finished", handleDuelFinished);
    s.on("room_update", handleRoomUpdate);
    s.on("duel_role", handleRole);

    s.on("connect", () => {
      const userId = user?._id || user?.id || null;
      console.log("socket connected on client, emitting join_duel", {
        roomId,
        userId,
      });
      s.emit("join_duel", { roomId, userId });
    });

    return () => {
      s.off("duel_started", handleDuelStarted);
      s.off("duel_error", handleDuelError);
      s.off("duel_finished", handleDuelFinished);
      s.off("room_update", handleRoomUpdate);
      s.off("duel_role", handleRole);
      s.disconnect();
    };
  }, [roomId, user]);

  // -------------------- ACTIONS --------------------
  const handleRun = useCallback(
    async () => {
      if (!problem) {
        setRunOutput("Problem not loaded yet.");
        return;
      }
      try {
        setIsRunning(true);
        setRunOutput("Running...");

        const sampleInput = problem.exampleTests?.[0]?.input || "";

        const res = await api.post("/judge/run", {
          code,
          language,
          input: sampleInput,
        });

        const out =
          res.data.output ||
          res.data.stdout ||
          "No output received from runner.";
        setRunOutput(out);
      } catch (err) {
        const msg =
          err.response?.data?.error ||
          err.response?.data?.message ||
          "Error executing code.";
        setRunOutput(msg);
      } finally {
        setIsRunning(false);
      }
    },
    [problem, code, language]
  );

  const handleSubmit = useCallback(
    () => {
      if (!socket) {
        setRunOutput("Socket not connected.");
        return;
      }
      if (!user) {
        setRunOutput("You must be logged in to submit.");
        return;
      }
      if (!problem) {
        setRunOutput("Problem not loaded yet.");
        return;
      }

      // use same logic as join_duel for userId
      const userId = user?._id || user?.id;
      if (!userId) {
        setRunOutput("Unable to determine user id for submission.");
        return;
      }

      setIsSubmitting(true);
      setRunOutput("Submitting to duel...");

      socket.emit(
        "duel_submit_code",
        {
          roomId,
          userId,
          code,
          languageId: language,
        },
        (res) => {
          setIsSubmitting(false);

          if (!res || !res.ok) {
            setRunOutput(res?.message || "Submit failed.");
            return;
          }

          const judge = res.judge || {};
          const statusText =
            judge.status?.description ||
            (res.accepted ? "Accepted" : "Some tests failed");

          if (res.accepted) {
            setRunOutput(
              `Accepted! ✅\n\n${judge.stdout || ""}`.trim() || "Accepted! ✅"
            );
          } else {
            setRunOutput(
              `Some tests failed. ❌\n\nStatus: ${statusText}\n\n${
                judge.stderr || judge.stdout || ""
              }`
            );
          }
        }
      );
    },
    [socket, roomId, user, code, language, problem]
  );

  const handleStartDuel = useCallback(
    () => {
      if (!socket || hasStarted || !isHost) return;

      setStatus("Starting duel...");

      console.log("start_duel emit", { roomId, userId: user?._id || user?.id });

      socket.emit(
        "start_duel",
        { roomId, userId: user?._id || user?.id },
        (res = {}) => {
          console.log("start_duel ack", res);
          if (!res.ok) {
            setStatus(res.message || "Failed to start duel");
            setHasStarted(false);
          }
        }
      );
    },
    [socket, roomId, user, hasStarted, isHost]
  );

  const handleCopyCode = useCallback(
    async () => {
      if (!roomId) return;
      try {
        await navigator.clipboard.writeText(roomId);
        setCopyLabel("Copied!");
      } catch {
        setCopyLabel("Failed to copy");
      }
      setTimeout(() => setCopyLabel("Copy duel code"), 1500);
    },
    [roomId]
  );

  const startDisabled = !socket || hasStarted || !isHost;

  const renderSummary = () => {
    if (!duelSummary?.submissions || duelSummary.submissions.length === 0) {
      return null;
    }

    const myId = user?._id || user?.id || null;

    return (
      <div style={styles.resultSummary}>
        <div style={{ marginBottom: 2 }}>Results:</div>
        {duelSummary.submissions.map((sub) => (
          <div key={sub.userId} style={styles.resultRow}>
            <span>
              {myId && String(sub.userId) === String(myId)
                ? "You"
                : sub.userId.slice(0, 6) + "..."}
            </span>
            <span>
              {sub.passed}/{sub.total} tests
            </span>
          </div>
        ))}
      </div>
    );
  };

  // -------------------- RENDER --------------------
  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.titleBlock}>
          <h1 style={styles.title}>1v1 Duel Room</h1>
          <div style={styles.status}>{status}</div>

          {duelOutcome && (
            <div
              style={{
                ...styles.resultBanner,
                ...(duelOutcome === "win"
                  ? styles.resultWin
                  : duelOutcome === "lose"
                  ? styles.resultLose
                  : styles.resultDraw),
              }}
            >
              {duelOutcome === "win" && "🏆 You won the duel!"}
              {duelOutcome === "lose" && "❌ You lost the duel."}
              {duelOutcome === "draw" && "🤝 Duel ended in a draw."}
            </div>
          )}

          {duelOutcome && renderSummary()}
        </div>

        <div style={styles.headerActions}>
          {roomId && (
            <div style={styles.duelCodeText}>Room code: {roomId}</div>
          )}

          <button
            type="button"
            style={{ ...styles.buttonBase, ...styles.copyButton }}
            onClick={handleCopyCode}
          >
            {copyLabel}
          </button>

          {isHost ? (
            <button
              type="button"
              style={{
                ...styles.buttonBase,
                ...styles.startButton,
                ...(startDisabled ? styles.startButtonDisabled : {}),
              }}
              onClick={handleStartDuel}
              disabled={startDisabled}
            >
              {hasStarted ? "Duel started" : "Start Duel"}
            </button>
          ) : (
            !hasStarted && (
              <div
                style={{
                  fontSize: "12px",
                  opacity: 0.7,
                }}
              >
                Waiting for host to start the duel…
              </div>
            )
          )}
        </div>
      </header>

      <div style={styles.substatus}>
        {problem ? "Problem loaded" : "Waiting for problem..."}
      </div>

      <div style={styles.main}>
        <section style={styles.problemPanel}>
          {problem ? (
            <>
              <h2 style={styles.problemTitle}>{problem.title}</h2>
              <p style={styles.problemDescription}>{problem.description}</p>

              {problem?.constraints && (
                <>
                  <h3 style={styles.problemSubheading}>Constraints</h3>
                  <pre style={styles.problemConstraints}>
                    {problem.constraints}
                  </pre>
                </>
              )}

              {problem?.exampleTests?.length > 0 && (
                <>
                  <h3 style={styles.problemSubheading}>Examples</h3>
                  {problem.exampleTests.map((ex, idx) => (
                    <div key={idx} style={styles.exampleBox}>
                      <div style={styles.exampleBlock}>
                        <strong>Input:</strong>
                        <pre style={styles.examplePre}>{ex.input}</pre>
                      </div>
                      <div style={styles.exampleBlock}>
                        <strong>Output:</strong>
                        <pre style={styles.examplePre}>{ex.output}</pre>
                      </div>
                      {ex.explanation && (
                        <div style={styles.exampleBlock}>
                          <strong>Explanation:</strong>
                          <pre style={styles.examplePre}>
                            {ex.explanation}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}
            </>
          ) : (
            <div>
              <h3 style={styles.waitingProblemTitle}>Waiting for problem…</h3>
              <p style={styles.waitingProblemText}>
                The duel will start as soon as a problem is selected.
              </p>
            </div>
          )}
        </section>

        <section style={styles.editorPanel}>
          <div style={styles.editorPanelChild}>
            <MonacoCodeRunner
              value={code}
              onChange={setCode}
              language={language}
              onLanguageChange={setLanguage}
              onRun={handleRun}
              onSubmit={handleSubmit}
              runOutput={runOutput}
              allowSubmit={true}
              isRunning={isRunning}
              isSubmitting={isSubmitting}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
