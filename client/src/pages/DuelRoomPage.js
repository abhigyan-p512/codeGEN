// client/src/pages/DuelRoomPage.js
import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { createDuelSocket } from "../utils/duelSocket";
import MonacoCodeRunner from "../components/MonacoCodeRunner";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

const DEFAULT_LANGUAGE = "python";

const styles = {
  page: {
    padding: "20px 40px",
    color: "#f9fafb",
    background: "#020617",
    minHeight: "calc(100vh - 60px)",
    boxSizing: "border-box",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
    gap: "12px",
  },
  titleBlock: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  title: {
    fontSize: "28px",
    fontWeight: 700,
    margin: 0,
  },
  status: {
    fontSize: "14px",
    opacity: 0.85,
  },
  substatus: {
    fontSize: "15px",
    marginBottom: "14px",
    opacity: 0.8,
  },
  main: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.05fr) minmax(0, 1.7fr)",
    gap: "18px",
    alignItems: "stretch",
  },
  problemPanel: {
    background: "#020617",
    borderRadius: "14px",
    padding: "16px 18px",
    border: "1px solid #1f2937",
    boxShadow: "0 0 0 1px rgba(15, 23, 42, 0.6)",
    maxHeight: "calc(100vh - 170px)",
    overflowY: "auto",
  },
  problemTitle: {
    fontSize: "20px",
    marginBottom: "8px",
  },
  problemDescription: {
    fontSize: "14px",
    lineHeight: 1.5,
    marginBottom: "12px",
    whiteSpace: "pre-wrap",
  },
  problemSubheading: {
    marginTop: "14px",
    marginBottom: "6px",
    fontSize: "15px",
  },
  problemConstraints: {
    background: "#020617",
    borderRadius: "8px",
    border: "1px solid #111827",
    padding: "8px 10px",
    fontSize: "13px",
    whiteSpace: "pre-wrap",
  },
  exampleBox: {
    background: "#020617",
    borderRadius: "10px",
    padding: "10px 12px",
    marginBottom: "10px",
    border: "1px solid #111827",
  },
  exampleBlock: {
    marginBottom: "6px",
  },
  examplePre: {
    margin: "4px 0 0 0",
    fontSize: "13px",
    whiteSpace: "pre-wrap",
  },
  waitingProblemTitle: {
    margin: "0 0 4px 0",
  },
  waitingProblemText: {
    margin: 0,
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

  // Header actions (buttons)
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

  // ---------------------------- SOCKET SETUP ----------------------------
  // 1) create socket once
  useEffect(() => {
    const s = createDuelSocket(); // URL + token handled inside duelSocket.js :contentReference[oaicite:5]{index=5}
    setSocket(s);

    // server will send problem + meta on "duel_started" :contentReference[oaicite:6]{index=6}
    s.on("duel_started", (payload) => {
      if (payload?.problem) {
        setProblem(payload.problem);
      }
      setStatus("Duel in progress");
      setHasStarted(true);
    });

    s.on("duel_error", (err) => {
      setStatus(err?.message || "Duel error");
    });

    s.on("duel_finished", (payload) => {
      if (payload?.winner) {
        setStatus("Duel finished – winner decided");
      } else {
        setStatus("Duel finished – draw");
      }
    });

    return () => {
      s.disconnect();
    };
  }, []);

  // 2) join the duel room once we know socket + user + roomId
  useEffect(() => {
    if (!socket) return;
    if (!roomId || !user?._id) return;

    socket.emit("join_duel", { roomId, userId: user._id }); // :contentReference[oaicite:7]{index=7}
  }, [socket, roomId, user]);

  // ---------------------------- ACTIONS ----------------------------
  // Run against example input via /judge/run (like ProblemPage) :contentReference[oaicite:8]{index=8}
  const handleRun = useCallback(async () => {
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
  }, [problem, code, language]);

  // Submit to duel via socket
  const handleSubmit = useCallback(() => {
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

    setIsSubmitting(true);
    setRunOutput("Submitting to duel...");

    socket.emit(
      "duel_submit_code",
      {
        roomId,
        userId: user._id,
        code,
        languageId: language, // server expects "python" | "javascript" | "cpp" strings :contentReference[oaicite:9]{index=9}
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
  }, [socket, roomId, user, code, language, problem]);

  const handleStartDuel = useCallback(() => {
    if (!socket || hasStarted) return;

    setStatus("Starting duel...");
    setHasStarted(true);

    socket.emit("start_duel", { roomId }, (res) => {
      if (!res || !res.ok) {
        setHasStarted(false);
        setStatus(res?.message || "Failed to start duel");
      }
      // on success, server will emit "duel_started" which sets problem + status
    });
  }, [socket, roomId, hasStarted]);

  const handleCopyCode = useCallback(async () => {
    if (!roomId) return;
    try {
      await navigator.clipboard.writeText(roomId);
      setCopyLabel("Copied!");
    } catch {
      setCopyLabel("Failed to copy");
    }
    setTimeout(() => setCopyLabel("Copy duel code"), 1500);
  }, [roomId]);

  const startDisabled = !socket || hasStarted;

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.titleBlock}>
          <h1 style={styles.title}>1v1 Duel Room</h1>
          <div style={styles.status}>{status}</div>
        </div>

        <div style={styles.headerActions}>
          {roomId && (
            <div style={styles.duelCodeText}>Room code: {roomId}</div>
          )}

          <button
            type="button"
            style={{
              ...styles.buttonBase,
              ...styles.copyButton,
            }}
            onClick={handleCopyCode}
          >
            {copyLabel}
          </button>

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
        </div>
      </header>

      <div style={styles.substatus}>
        {problem ? "Problem loaded" : "Waiting for problem..."}
      </div>

      <div style={styles.main}>
        {/* -------- LEFT: Problem Statement -------- */}
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

        {/* -------- RIGHT: Monaco Code Runner -------- */}
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
