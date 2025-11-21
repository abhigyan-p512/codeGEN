import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import SimpleCodeEditor from "../components/SimpleCodeEditor"; // adjust path if different
import "./Profile.css";

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || (process.env.REACT_APP_API_URL || "http://localhost:5000");

export default function Duel() {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [players, setPlayers] = useState([]);
  const [problem, setProblem] = useState(null);
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [winner, setWinner] = useState(null);
  const editorRef = useRef();
  const [language, setLanguage] = useState("python3");
  const [stdin, setStdin] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("No token, cannot connect to duel socket");
      return;
    }
    const s = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
    });

    s.on("connect", () => setConnected(true));
    s.on("disconnect", () => setConnected(false));
    s.on("room_update", (d) => {
      setRoomId(d.roomId || "");
      setPlayers(d.players || []);
      setStarted(d.started || false);
      pushMsg("Room updated");
    });
    s.on("duel_started", (d) => {
      setProblem(d.problem || null);
      setStarted(true);
      pushMsg("Duel started");
    });
    s.on("duel_submission_update", (d) => {
      const at = d.attempt;
      pushMsg(`${at.user.name} attempted — passed: ${at.passedTests ?? "—"} accepted: ${at.accepted ? "YES" : "NO"}`);
    });
    s.on("duel_ended", (d) => {
      setWinner(d.winner);
      pushMsg(`Duel ended — winner: ${d.winner}`);
      // show more summary if needed
    });
    s.on("duel_error", (e) => pushMsg(`Error: ${e.message || e}`));

    setSocket(s);
    return () => {
      try { s.disconnect(); } catch (e) {}
      setSocket(null);
    };
    // eslint-disable-next-line
  }, []);

  function pushMsg(txt) {
    setMessages((m) => [...m, { t: Date.now(), txt }].slice(-80));
  }

  function handleCreate() {
    if (!socket) return;
    socket.emit("create_duel", { timeLimit: 600 }, (resp) => {
      if (resp && resp.roomId) {
        setRoomId(resp.roomId);
        pushMsg(`Created room ${resp.roomId}`);
      } else pushMsg("Create failed");
    });
  }

  function handleJoin() {
    if (!socket || !roomId) return;
    socket.emit("join_duel", { roomId }, (resp) => {
      if (resp && resp.ok) pushMsg(`Joined ${roomId}`);
      else pushMsg(`Join failed: ${resp?.message || "unknown"}`);
    });
  }

  function handleStart() {
    if (!socket || !roomId) return;
    socket.emit("start_duel", { roomId }, (resp) => {
      if (resp && resp.ok) pushMsg("Start requested");
      else pushMsg(`Start failed: ${resp?.message || "unknown"}`);
    });
  }

  async function handleRunAndSubmit({ source }) {
    if (!socket || !roomId) {
      pushMsg("Join or create a room first");
      return;
    }
    setSubmitting(true);
    pushMsg("Submitting to server...");
    socket.emit("duel_submit_code", { roomId, source, language, stdin }, (resp) => {
      if (!resp) {
        pushMsg("No response from server");
      } else if (!resp.ok) {
        pushMsg(`Submit error: ${resp.message}`);
      } else {
        // server will broadcast duel_submission_update and duel_ended as needed
        const accepted = resp.accepted;
        pushMsg(`Server judged submission${accepted ? " — AC!" : ""}`);
      }
      setSubmitting(false);
    });
  }

  return (
    <div className="page-wrap" style={{ padding: 20 }}>
      <div className="profile-card" style={{ padding: 16 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
          <button className="btn" onClick={handleCreate} disabled={!socket}>Create Room</button>
          <input value={roomId} onChange={(e) => setRoomId(e.target.value)} placeholder="Room ID" style={{ padding: 8, borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.06)", color: "#e8e8e8" }} />
          <button className="btn" onClick={handleJoin}>Join</button>
          <button className="btn btn-primary" onClick={handleStart} disabled={!roomId}>Start Duel</button>
          <div style={{ marginLeft: "auto", color: "#bfc1c3" }}>Socket: {connected ? "connected" : "disconnected"}</div>
        </div>

        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: 12 }}>
              <strong>Players:</strong>
              <div>{players.map((p) => <span key={p.id} style={{ marginRight: 8 }}>{p.name || p.username}</span>)}</div>
            </div>

            {problem ? (
              <div className="panel" style={{ marginBottom: 12 }}>
                <div className="panel-title">Problem: {problem.title}</div>
                <div className="panel-body" style={{ whiteSpace: "pre-wrap" }}>{problem.description}</div>
              </div>
            ) : <div className="muted">No problem yet. Start duel to get a problem.</div>}

            {started && problem && (
              <>
                <SimpleCodeEditor ref={editorRef} defaultLanguage={language} onLanguageChange={(l) => setLanguage(l)} onRun={handleRunAndSubmit} allowSubmit runDisabled={submitting} />
                <div style={{ marginTop: 8 }}>
                  <label style={{ color: "#bfc1c3", marginRight: 8 }}>stdin:</label>
                  <input value={stdin} onChange={(e) => setStdin(e.target.value)} style={{ padding: 6, borderRadius: 6, background: "transparent", border: "1px solid rgba(255,255,255,0.04)", color: "#e8e8e8", width: "60%" }} />
                </div>
              </>
            )}
          </div>

          <aside style={{ width: 320 }}>
            <div className="panel" style={{ marginBottom: 12 }}>
              <div className="panel-title">Status</div>
              <div className="panel-body" style={{ maxHeight: 260, overflowY: "auto" }}>
                {messages.map((m) => <div key={m.t} style={{ fontSize: 13 }}>{new Date(m.t).toLocaleTimeString()} — {m.txt}</div>)}
              </div>
            </div>

            <div className="panel">
              <div className="panel-title">Result</div>
              <div className="panel-body">
                {winner ? <div style={{ fontWeight: 700 }}>{winner} won!</div> : <div className="muted">No winner yet</div>}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}