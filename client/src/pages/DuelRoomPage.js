// client/src/pages/DuelRoomPage.js
import React, { useState, useEffect, useCallback, useRef } from "react";
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
  timer: {
    fontSize: "16px",
    fontWeight: 600,
    fontFamily: "monospace",
    color: "#818cf8",
    background: "rgba(129, 140, 248, 0.1)",
    border: "1px solid rgba(129, 140, 248, 0.3)",
    borderRadius: "8px",
    padding: "6px 12px",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    marginTop: "4px",
  },
  timerWarning: {
    color: "#f87171",
    background: "rgba(248, 113, 113, 0.1)",
    border: "1px solid rgba(248, 113, 113, 0.3)",
    animation: "pulse 1s infinite",
  },
  timerCritical: {
    color: "#ef4444",
    background: "rgba(239, 68, 68, 0.15)",
    border: "1px solid rgba(239, 68, 68, 0.5)",
    animation: "pulse 0.5s infinite",
  },
  substatus: {
    fontSize: "13px",
    opacity: 0.75,
  },
  main: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1.3fr) minmax(320px, 0.9fr)",
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
  const [duelStartTime, setDuelStartTime] = useState(null);
  const [remainingTime, setRemainingTime] = useState(900); // 15 minutes in seconds

  const [players, setPlayers] = useState([]);
  const [isHost, setIsHost] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatVisible, setChatVisible] = useState(true);
  const chatMessagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

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
      
      // Set the start time for the timer (use server timestamp if available, otherwise use current time)
      const startTime = payload?.startedAt || Date.now();
      setDuelStartTime(startTime);
      setRemainingTime(900); // Reset to 15 minutes (900 seconds)

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
      // Stop the timer
      setDuelStartTime(null);
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

    const handleChatHistory = (msgs = []) => {
      setChatMessages(Array.isArray(msgs) ? msgs : []);
    };

    const handleChatMessage = (msg) => {
      setChatMessages((prev) => [...prev, msg]);
    };

    s.on("duel_started", handleDuelStarted);
    s.on("duel_error", handleDuelError);
    s.on("duel_finished", handleDuelFinished);
    s.on("room_update", handleRoomUpdate);
    s.on("duel_role", handleRole);
    s.on("duel_chat_history", handleChatHistory);
    s.on("duel_chat_message", handleChatMessage);

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
      s.off("duel_chat_history", handleChatHistory);
      s.off("duel_chat_message", handleChatMessage);
      s.disconnect();
    };
  }, [roomId, user]);

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatMessagesEndRef.current) {
      chatMessagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  // Timer effect - updates remaining time countdown every second
  useEffect(() => {
    if (!duelStartTime || !hasStarted) {
      return;
    }

    const DUEL_DURATION = 900; // 15 minutes in seconds

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - duelStartTime) / 1000);
      const remaining = Math.max(0, DUEL_DURATION - elapsed);
      setRemainingTime(remaining);

      // If time runs out, the server should handle ending the duel
      // But we can show 00:00 here
      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 1000);

    // Initial update
    const now = Date.now();
    const elapsed = Math.floor((now - duelStartTime) / 1000);
    const remaining = Math.max(0, DUEL_DURATION - elapsed);
    setRemainingTime(remaining);

    return () => clearInterval(interval);
  }, [duelStartTime, hasStarted]);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Chat send
  const sendChat = async () => {
    if (!socket) return;
    const msg = (chatInput || "").trim();
    if (!msg) return;
    const userId = user?._id || user?.id || null;
    socket.emit(
      "duel_chat_message",
      { roomId, userId, message: msg },
      (res = {}) => {
        if (res.ok) setChatInput("");
        else alert(res.message || "Failed to send message");
      }
    );
  };

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
          
          {hasStarted && duelStartTime && (
            <div
              style={{
                ...styles.timer,
                ...(remainingTime <= 60
                  ? styles.timerCritical
                  : remainingTime <= 120
                  ? styles.timerWarning
                  : {}),
              }}
            >
              <span>⏱️</span>
              <span>{formatTime(remainingTime)}</span>
            </div>
          )}

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

      <div 
        style={{
          ...styles.main,
          gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1.3fr)",
        }}
      >
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

      {/* Chat panel - Floating overlay */}
      {chatVisible && (
        <section
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
            border: "1px solid rgba(129, 140, 248, 0.2)",
            borderRadius: 14,
            padding: 0,
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.5), 0 4px 8px rgba(129, 140, 248, 0.3)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            width: window.innerWidth < 768 ? "320px" : "380px",
            height: window.innerWidth < 768 ? "320px" : "380px",
            minHeight: window.innerWidth < 768 ? "320px" : "380px",
            maxHeight: window.innerWidth < 768 ? "320px" : "380px",
            zIndex: 1000,
            transition: "transform 0.3s ease, opacity 0.3s ease",
          }}
        >
        {/* Chat Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 20px",
            background: "rgba(129, 140, 248, 0.1)",
            borderBottom: "1px solid rgba(129, 140, 248, 0.2)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#10b981",
                boxShadow: "0 0 8px rgba(16, 185, 129, 0.6)",
                animation: "pulse 2s infinite",
              }}
            />
            <div style={{ fontWeight: 700, fontSize: 16, color: "#e5e7eb" }}>Room Chat</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                fontSize: 12,
                opacity: 0.7,
                color: "#9ca3af",
                background: "rgba(0, 0, 0, 0.2)",
                padding: "4px 10px",
                borderRadius: 12,
              }}
            >
              {chatMessages.length} {chatMessages.length === 1 ? "message" : "messages"}
            </div>
            <button
              onClick={() => setChatVisible(false)}
              style={{
                background: "rgba(239, 68, 68, 0.2)",
                border: "1px solid rgba(239, 68, 68, 0.4)",
                borderRadius: 8,
                padding: "6px 10px",
                cursor: "pointer",
                color: "#fecaca",
                fontSize: 12,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(239, 68, 68, 0.3)";
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
                e.currentTarget.style.transform = "scale(1)";
              }}
              title="Hide chat"
            >
              <span>−</span>
              <span>Hide</span>
            </button>
          </div>
        </div>

        {/* Messages Container */}
        <div
          ref={chatContainerRef}
          className="chatMessages"
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            padding: "16px",
            background: "rgba(15, 23, 42, 0.5)",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {chatMessages.length === 0 ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                color: "#6b7280",
                fontSize: 14,
                fontStyle: "italic",
              }}
            >
              No messages yet. Start the conversation!
            </div>
          ) : (
            chatMessages.map((m, idx) => {
              const myId = user?._id || user?.id || null;
              const isMyMessage = myId && m.userId && String(m.userId) === String(myId);
              const timestamp = m.createdAt
                ? new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "";

              return (
                <div
                  key={m.id || idx}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    alignSelf: isMyMessage ? "flex-end" : "flex-start",
                    maxWidth: "75%",
                    animation: "fadeIn 0.3s ease-in",
                  }}
                >
                  <div
                    style={{
                      padding: "10px 14px",
                      borderRadius: isMyMessage ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                      background: isMyMessage
                        ? "linear-gradient(135deg, rgba(129, 140, 248, 0.3) 0%, rgba(236, 72, 153, 0.3) 100%)"
                        : "rgba(31, 41, 55, 0.8)",
                      border: isMyMessage
                        ? "1px solid rgba(129, 140, 248, 0.4)"
                        : "1px solid rgba(75, 85, 99, 0.3)",
                      boxShadow: isMyMessage
                        ? "0 2px 8px rgba(129, 140, 248, 0.2)"
                        : "0 2px 4px rgba(0, 0, 0, 0.2)",
                      wordWrap: "break-word",
                      transition: "transform 0.1s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "scale(1.02)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                  >
                    {!isMyMessage && (
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#818cf8",
                          marginBottom: 6,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <span>{m.username || (m.userId ? String(m.userId).slice(0, 8) + "..." : "Anonymous")}</span>
                        {timestamp && (
                          <span style={{ fontSize: 10, opacity: 0.6, color: "#9ca3af", fontWeight: 400 }}>
                            {timestamp}
                          </span>
                        )}
                      </div>
                    )}
                    <div
                      style={{
                        fontSize: 14,
                        lineHeight: 1.5,
                        color: "#e5e7eb",
                        wordBreak: "break-word",
                      }}
                    >
                      {m.message}
                    </div>
                    {isMyMessage && timestamp && (
                      <div
                        style={{
                          fontSize: 10,
                          opacity: 0.6,
                          color: "#9ca3af",
                          marginTop: 4,
                          textAlign: "right",
                        }}
                      >
                        {timestamp}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={chatMessagesEndRef} />
        </div>

        {/* Input Container */}
        <div
          style={{
            display: "flex",
            gap: 10,
            padding: "16px 20px",
            background: "rgba(15, 23, 42, 0.6)",
            borderTop: "1px solid rgba(129, 140, 248, 0.1)",
          }}
        >
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Type a message..."
            style={{
              flex: 1,
              padding: "12px 16px",
              borderRadius: 12,
              border: "1px solid rgba(129, 140, 248, 0.3)",
              background: "rgba(15, 23, 42, 0.8)",
              color: "#e5e7eb",
              fontSize: 14,
              outline: "none",
              transition: "all 0.2s ease",
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendChat();
              }
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "rgba(129, 140, 248, 0.6)";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(129, 140, 248, 0.1)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(129, 140, 248, 0.3)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
          <button
            onClick={sendChat}
            disabled={!chatInput.trim()}
            style={{
              padding: "12px 24px",
              borderRadius: 12,
              background: chatInput.trim()
                ? "linear-gradient(135deg, rgba(129, 140, 248, 1) 0%, rgba(236, 72, 153, 1) 100%)"
                : "rgba(75, 85, 99, 0.5)",
              color: "#ffffff",
              fontWeight: 600,
              fontSize: 14,
              border: "none",
              cursor: chatInput.trim() ? "pointer" : "not-allowed",
              transition: "all 0.2s ease",
              boxShadow: chatInput.trim() ? "0 2px 8px rgba(129, 140, 248, 0.3)" : "none",
            }}
            onMouseEnter={(e) => {
              if (chatInput.trim()) {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(129, 140, 248, 0.4)";
              }
            }}
            onMouseLeave={(e) => {
              if (chatInput.trim()) {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(129, 140, 248, 0.3)";
              }
            }}
          >
            Send
          </button>
        </div>
        </section>
      )}

      {/* Floating button to show chat when hidden */}
        {!chatVisible && (
          <button
            onClick={() => setChatVisible(true)}
            style={{
              position: "fixed",
              bottom: 24,
              right: 24,
              background: "linear-gradient(135deg, rgba(129, 140, 248, 1) 0%, rgba(236, 72, 153, 1) 100%)",
              border: "none",
              borderRadius: "50%",
              width: 56,
              height: 56,
              cursor: "pointer",
              color: "#ffffff",
              fontSize: 20,
              fontWeight: 700,
              boxShadow: "0 4px 12px rgba(129, 140, 248, 0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.3s ease",
              zIndex: 1000,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.1)";
              e.currentTarget.style.boxShadow = "0 6px 16px rgba(129, 140, 248, 0.6)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(129, 140, 248, 0.4)";
            }}
            title="Show chat"
          >
            💬
          </button>
        )}
    </div>
  );
}
