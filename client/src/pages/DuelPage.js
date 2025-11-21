// client/src/pages/DuelPage.js
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function DuelPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [roomCode, setRoomCode] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/login", {
        state: { from: location.pathname, message: "You must be logged in" },
      });
    }
  }, [user, navigate, location.pathname]);

  if (!user) return null;

  const generateRoomCode = () =>
    Math.random().toString(36).substring(2, 8).toLowerCase();

  const handleCreateRoom = () => {
    const code = generateRoomCode();
    navigate(`/duel-room/${code}`, { state: { isHost: true } });
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    let code = roomCode.trim();
    if (!code) return;

    try {
      if (code.startsWith("http")) {
        const u = new URL(code);
        const parts = u.pathname.split("/").filter(Boolean);
        code = parts[parts.length - 1];
      }
    } catch (_) {}

    navigate(`/duel-room/${code}`, { state: { isHost: false } });
  };

  return (
    <div className="page-container">
      <div
        className="page-card"
        style={{
          borderRadius: 28,
          padding: 28,
          border: "1px solid #111827",
          background:
            "radial-gradient(circle at top, rgba(96,165,250,0.15), transparent 60%), #050509",
          boxShadow: "0 28px 80px rgba(0,0,0,0.9)",
        }}
      >
        <h1 className="page-heading" style={{ marginBottom: 6 }}>
          1v1 Duel
        </h1>
        <p className="page-subtitle" style={{ maxWidth: 520 }}>
          Create a private room and share the code, or join an existing room to
          battle a friend in real time.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1.5rem",
            marginTop: "1.8rem",
          }}
        >
          {/* Create */}
          <div
            style={{
              padding: "1.4rem 1.6rem",
              borderRadius: 20,
              border: "1px solid rgba(59,130,246,0.5)",
              background:
                "linear-gradient(135deg, rgba(15,23,42,0.9), rgba(15,23,42,1))",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "0.6rem",
              }}
            >
              <h3 className="section-title" style={{ marginBottom: 0 }}>
                Create Room
              </h3>
              <span
                style={{
                  fontSize: 11,
                  color: "#a5b4fc",
                  textTransform: "uppercase",
                  letterSpacing: 0.12,
                }}
              >
                Host
              </span>
            </div>
            <p className="page-muted" style={{ marginBottom: "0.9rem" }}>
              Generate a short room code and invite your opponent by sharing the
              URL or code.
            </p>
            <button
              className="btn btn-primary"
              onClick={handleCreateRoom}
              style={{ borderRadius: 999, fontWeight: 600 }}
            >
              Create New Room
            </button>
          </div>

          {/* Join */}
          <div
            style={{
              padding: "1.4rem 1.6rem",
              borderRadius: 20,
              border: "1px solid rgba(16,185,129,0.5)",
              background:
                "linear-gradient(135deg, rgba(15,23,42,0.9), rgba(15,23,42,1))",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "0.6rem",
              }}
            >
              <h3 className="section-title" style={{ marginBottom: 0 }}>
                Join Room
              </h3>
              <span
                style={{
                  fontSize: 11,
                  color: "#6ee7b7",
                  textTransform: "uppercase",
                  letterSpacing: 0.12,
                }}
              >
                Guest
              </span>
            </div>
            <p className="page-muted" style={{ marginBottom: "0.6rem" }}>
              Enter the room code or full duel URL shared by your friend.
            </p>
            <form
              onSubmit={handleJoinRoom}
              style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}
            >
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                className="input-control"
                placeholder="e.g. ab12cd or full URL"
                style={{ maxWidth: 260, textTransform: "lowercase" }}
              />
              <button type="submit" className="btn btn-secondary">
                Join Room
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DuelPage;
