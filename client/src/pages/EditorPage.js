import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import createDuelSocket from "../utils/duelSocket";
import api from "../utils/api";

const headerStyles = {
  wrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 20px",
    background:
      "linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(30,64,175,0.95) 100%)",
    color: "#e5e7eb",
    borderBottom: "1px solid rgba(148,163,184,0.3)",
  },
  logo: {
    fontWeight: 800,
    fontSize: 20,
    letterSpacing: "0.08em",
  },
  right: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  button: {
    borderRadius: 999,
    padding: "6px 14px",
    fontSize: 13,
    fontWeight: 500,
    border: "1px solid transparent",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  },
  copyButton: {
    background: "rgba(15,23,42,0.9)",
    color: "#e5e7eb",
    borderColor: "rgba(148,163,184,0.5)",
  },
  leaveButton: {
    background:
      "linear-gradient(135deg, rgba(248,113,113,1) 0%, rgba(239,68,68,1) 100%)",
    color: "#0b1020",
    borderColor: "rgba(248,113,113,0.8)",
  },
};

export default function EditorPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [socket, setSocket] = useState(null);
  const [clients, setClients] = useState([]);
  const [code, setCode] = useState(
    `// Collaborative editor\n// Everyone in this room sees the same code in real time.\n\nfunction hello() {\n  console.log("Hello from ${roomId}!");\n}\n`
  );
  const [copyLabel, setCopyLabel] = useState("Copy room ID");

  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");

  // Local-only execution state (not synchronized across users)
  const [language, setLanguage] = useState("javascript");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const languages = [
    { value: "javascript", label: "JavaScript" },
    { value: "python", label: "Python" },
    { value: "java", label: "Java" },
    { value: "cpp", label: "C++" },
  ];

  const codeRef = useRef(code);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (!roomId) return;

    const s = createDuelSocket();
    setSocket(s);

    const username = user?.username || user?.email || "Guest";

    s.on("connect", () => {
      s.emit("collab_join", { roomId, username });
    });

    s.on("collab_clients", ({ clients: list = [] } = {}) => {
      setClients(list);
    });

    s.on("collab_sync_code", ({ code: initialCode = "" } = {}) => {
      codeRef.current = initialCode || "";
      setCode(initialCode || "");
    });

    s.on("collab_code_change", ({ code: newCode = "" } = {}) => {
      codeRef.current = newCode;
      setCode(newCode);
    });

    s.on("collab_chat_message", (msg) => {
      setChatMessages((prev) => [...prev, msg]);
    });

    return () => {
      s.off("collab_clients");
      s.off("collab_sync_code");
      s.off("collab_code_change");
      s.off("collab_chat_message");
      s.disconnect();
    };
  }, [roomId, user]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  const handleCopyRoomId = async () => {
    if (!roomId) return;
    try {
      await navigator.clipboard.writeText(roomId);
      setCopyLabel("Copied!");
      setTimeout(() => setCopyLabel("Copy room ID"), 1500);
    } catch {
      setCopyLabel("Failed");
      setTimeout(() => setCopyLabel("Copy room ID"), 1500);
    }
  };

  const handleLeave = () => {
    if (socket) {
      socket.disconnect();
    }
    navigate("/simple-editor");
  };

  const handleCodeChange = (e) => {
    const newCode = e.target.value;
    setCode(newCode);
    codeRef.current = newCode;
    if (socket) {
      socket.emit("collab_code_change", { roomId, code: newCode });
    }
  };

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
  };

  const executeJavaScript = async (jsCode) => {
    return new Promise((resolve) => {
      let capturedOutput = "";
      const originalLog = console.log;

      console.log = (...args) => {
        capturedOutput +=
          args
            .map((arg) =>
              typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)
            )
            .join(" ") + "\n";
      };

      try {
        // Use Function constructor for scoped execution
        // eslint-disable-next-line no-new-func
        const func = new Function(jsCode);
        func();
        console.log = originalLog;
        resolve(capturedOutput || "Code executed successfully!");
      } catch (error) {
        console.log = originalLog;
        resolve(`Error: ${error.message}`);
      }
    });
  };

  const executeCodeViaAPI = async (codeToRun, lang) => {
    try {
      const response = await api.post("/judge/run", {
        code: codeToRun,
        language: lang,
        input: "",
      });

      if (response.data?.error) {
        return `Error: ${response.data.error}`;
      }

      return response.data?.output || "Code executed successfully!";
    } catch (error) {
      if (error.response) {
        return `Error: ${
          error.response.data?.error || error.response.statusText || "Unknown error"
        }`;
      }
      if (error.request) {
        return "Error: Could not connect to the server. Please make sure the backend is running.";
      }
      return `Error: ${error.message}`;
    }
  };

  const runCode = async () => {
    setIsRunning(true);
    setOutput("Running code...\n");

    try {
      if (language === "javascript") {
        const result = await executeJavaScript(code);
        setOutput(result);
      } else if (language === "python" || language === "java" || language === "cpp") {
        const result = await executeCodeViaAPI(code, language);
        setOutput(result);
      } else {
        setOutput(
          `Code execution for ${language} is not yet implemented.\nThis is a demo version.`
        );
      }
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const sendChat = () => {
    if (!socket) return;
    const text = (chatInput || "").trim();
    if (!text) return;
    const username = user?.username || user?.email || "Guest";
    socket.emit(
      "collab_chat_message",
      { roomId, username, message: text },
      (res = {}) => {
        if (res.ok) {
          setChatInput("");
        }
      }
    );
  };

  const displayName = user?.username || user?.email || "Guest";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#e5e7eb",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <header style={headerStyles.wrapper}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={headerStyles.logo}>CodeGen4Future</div>
          <div style={{ fontSize: 13, opacity: 0.75 }}>
            Room: <strong>{roomId}</strong> · You are{" "}
            <strong>{displayName}</strong>
          </div>
        </div>
        <div style={headerStyles.right}>
          <button
            type="button"
            style={{ ...headerStyles.button, ...headerStyles.copyButton }}
            onClick={handleCopyRoomId}
          >
            📋 {copyLabel}
          </button>
          <button
            type="button"
            style={{ ...headerStyles.button, ...headerStyles.leaveButton }}
            onClick={handleLeave}
          >
            🚪 Leave
          </button>
        </div>
      </header>

      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.4fr) minmax(280px, 0.9fr)",
          gap: 16,
          padding: 16,
          boxSizing: "border-box",
        }}
      >
        {/* Code editor */}
        <section
          style={{
            background: "#020617",
            borderRadius: 14,
            border: "1px solid #1f2937",
            boxShadow: "0 0 0 1px rgba(15,23,42,0.7)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "10px 14px",
              borderBottom: "1px solid #1f2937",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>
                Collaborative Code Editor
              </div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                {clients.length}{" "}
                {clients.length === 1 ? "user online" : "users online"}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
                justifyContent: "flex-end",
              }}
            >
              <label
                htmlFor="collab-language"
                style={{ fontSize: 12, opacity: 0.8 }}
              >
                Language:
              </label>
              <select
                id="collab-language"
                value={language}
                onChange={handleLanguageChange}
                style={{
                  background: "#020617",
                  color: "#e5e7eb",
                  borderRadius: 999,
                  border: "1px solid rgba(75,85,99,0.9)",
                  padding: "4px 10px",
                  fontSize: 12,
                  outline: "none",
                }}
              >
                {languages.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={runCode}
                disabled={isRunning}
                style={{
                  borderRadius: 999,
                  padding: "6px 14px",
                  border: "none",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: isRunning ? "wait" : "pointer",
                  background: isRunning
                    ? "rgba(55,65,81,0.9)"
                    : "linear-gradient(135deg,#22c55e,#4ade80)",
                  color: "#020617",
                  boxShadow: isRunning
                    ? "none"
                    : "0 8px 20px rgba(34,197,94,0.4)",
                  whiteSpace: "nowrap",
                }}
              >
                {isRunning ? "Running..." : "Run code"}
              </button>
            </div>
          </div>
          <div
            style={{
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <textarea
              value={code}
              onChange={handleCodeChange}
              spellCheck="false"
              style={{
                flex: 1,
                minHeight: 0,
                border: "none",
                outline: "none",
                resize: "none",
                background: "#020617",
                color: "#e5e7eb",
                fontFamily:
                  "JetBrains Mono, Menlo, Monaco, Consolas, monospace",
                fontSize: 14,
                padding: 14,
                lineHeight: 1.5,
                whiteSpace: "pre",
              }}
              placeholder="// Start typing to collaborate..."
            />
            <div
              style={{
                borderTop: "1px solid #1f2937",
                padding: "10px 14px",
                background:
                  "radial-gradient(circle at top, rgba(15,23,42,0.9), #020617)",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  marginBottom: 6,
                  opacity: 0.8,
                }}
              >
                Output
              </div>
              <pre
                style={{
                  margin: 0,
                  maxHeight: 160,
                  overflowY: "auto",
                  fontSize: 12,
                  lineHeight: 1.5,
                  background: "rgba(15,23,42,0.9)",
                  borderRadius: 10,
                  padding: 10,
                  border: "1px solid rgba(31,41,55,0.9)",
                  whiteSpace: "pre-wrap",
                }}
              >
                {output || "Run the current code to see output here..."}
              </pre>
            </div>
          </div>
        </section>

        {/* Sidebar: users + chat */}
        <section
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {/* Connected users */}
          <div
            style={{
              background: "#020617",
              borderRadius: 14,
              border: "1px solid #1f2937",
              boxShadow: "0 0 0 1px rgba(15,23,42,0.7)",
              padding: 12,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                marginBottom: 4,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>👥</span>
              <span>Connected Users</span>
            </div>
            {clients.length === 0 ? (
              <div style={{ fontSize: 13, opacity: 0.7 }}>
                Waiting for others to join this room…
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  maxHeight: 160,
                  overflowY: "auto",
                }}
              >
                {clients.map((c) => (
                  <div
                    key={c.socketId}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "6px 8px",
                      borderRadius: 10,
                      background: "rgba(15,23,42,0.7)",
                      border: "1px solid rgba(55,65,81,0.8)",
                    }}
                  >
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: "999px",
                        background:
                          "linear-gradient(135deg, #6366f1, #ec4899)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#0f172a",
                      }}
                    >
                      {c.username?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <span style={{ fontSize: 13, fontWeight: 500 }}>
                        {c.username || "User"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chat */}
          <div
            style={{
              flex: 1,
              minHeight: 0,
              background: "#020617",
              borderRadius: 14,
              border: "1px solid #1f2937",
              boxShadow: "0 0 0 1px rgba(15,23,42,0.7)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                padding: "10px 12px",
                borderBottom: "1px solid #1f2937",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                <span>💬</span>
                <span>Room Chat</span>
              </div>
              <div style={{ fontSize: 11, opacity: 0.7 }}>
                {chatMessages.length} message
                {chatMessages.length === 1 ? "" : "s"}
              </div>
            </div>
            <div
              style={{
                flex: 1,
                minHeight: 0,
                padding: 10,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {chatMessages.length === 0 ? (
                <div
                  style={{
                    fontSize: 13,
                    opacity: 0.7,
                    fontStyle: "italic",
                    textAlign: "center",
                    marginTop: 16,
                  }}
                >
                  No messages yet. Say hi! 👋
                </div>
              ) : (
                chatMessages.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                      padding: "6px 8px",
                      borderRadius: 10,
                      background: "rgba(15,23,42,0.9)",
                      border: "1px solid rgba(55,65,81,0.8)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#a5b4fc",
                      }}
                    >
                      {m.username || "User"}
                    </div>
                    <div style={{ fontSize: 13 }}>{m.message}</div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>
            <div
              style={{
                padding: 10,
                borderTop: "1px solid #1f2937",
                display: "flex",
                gap: 8,
              }}
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendChat();
                  }
                }}
                placeholder="Type a message…"
                style={{
                  flex: 1,
                  borderRadius: 999,
                  border: "1px solid rgba(75,85,99,0.9)",
                  padding: "8px 12px",
                  fontSize: 13,
                  background: "#020617",
                  color: "#e5e7eb",
                  outline: "none",
                }}
              />
              <button
                type="button"
                onClick={sendChat}
                disabled={!chatInput.trim()}
                style={{
                  borderRadius: 999,
                  padding: "8px 16px",
                  fontSize: 13,
                  fontWeight: 600,
                  border: "none",
                  cursor: chatInput.trim() ? "pointer" : "not-allowed",
                  background: chatInput.trim()
                    ? "linear-gradient(135deg,#6366f1,#ec4899)"
                    : "rgba(55,65,81,0.8)",
                  color: "#0f172a",
                }}
              >
                Send
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}


