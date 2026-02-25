import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CollabEditorLobby() {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState("");

  const createRoom = () => {
    const id = Math.random().toString(36).slice(2, 8);
    navigate(`/collab-editor/${id}`);
  };

  const joinRoom = (e) => {
    e.preventDefault();
    const trimmed = (joinCode || "").trim();
    if (!trimmed) return;
    navigate(`/collab-editor/${trimmed}`);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#e5e7eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: 720,
          width: "100%",
          background:
            "radial-gradient(circle at top, rgba(129,140,248,0.2), transparent 55%), #020617",
          borderRadius: 18,
          border: "1px solid rgba(31,41,55,1)",
          boxShadow:
            "0 24px 80px rgba(15,23,42,0.9), 0 0 0 1px rgba(15,23,42,0.9)",
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <div style={{ marginBottom: 4 }}>
          <div
            style={{
              fontSize: 13,
              textTransform: "uppercase",
              letterSpacing: "0.18em",
              color: "#9ca3af",
              marginBottom: 8,
            }}
          >
            Collaborative Editor
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: 26,
              fontWeight: 700,
              background:
                "linear-gradient(135deg,#a5b4fc,#f9a8d4,#38bdf8,#22c55e)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Create a room or join by code
          </h1>
          <p
            style={{
              marginTop: 8,
              fontSize: 14,
              color: "#9ca3af",
            }}
          >
            Spin up a fresh collab room to share with friends, or paste an
            existing room ID to jump back into the session.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)",
            gap: 16,
          }}
        >
          {/* Create room card */}
          <div
            style={{
              borderRadius: 14,
              border: "1px solid rgba(55,65,81,1)",
              background:
                "linear-gradient(135deg,rgba(15,23,42,1),rgba(17,24,39,1))",
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 999,
                  background:
                    "conic-gradient(from 140deg,#6366f1,#ec4899,#22c55e,#6366f1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                }}
              >
                +
              </div>
              <div>
                <div
                  style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}
                >
                  Create new room
                </div>
                <div style={{ fontSize: 13, color: "#9ca3af" }}>
                  Generate a unique room and share the link with others.
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={createRoom}
              style={{
                marginTop: 8,
                borderRadius: 999,
                padding: "8px 16px",
                border: "none",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                background:
                  "linear-gradient(135deg,rgba(129,140,248,1),rgba(236,72,153,1))",
                color: "#020617",
                boxShadow: "0 10px 30px rgba(79,70,229,0.55)",
              }}
            >
              Create room
            </button>
          </div>

          {/* Join room card */}
          <form
            onSubmit={joinRoom}
            style={{
              borderRadius: 14,
              border: "1px solid rgba(55,65,81,1)",
              background:
                "linear-gradient(135deg,rgba(15,23,42,1),rgba(12,20,38,1))",
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 999,
                  background:
                    "radial-gradient(circle at 30% 0,#22c55e,#16a34a,#064e3b)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                }}
              >
                #
              </div>
              <div>
                <div
                  style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}
                >
                  Join existing room
                </div>
                <div style={{ fontSize: 13, color: "#9ca3af" }}>
                  Paste a room ID someone shared with you.
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Enter room ID, e.g. ab12cd"
                style={{
                  flex: 1,
                  borderRadius: 999,
                  border: "1px solid rgba(75,85,99,1)",
                  padding: "8px 12px",
                  fontSize: 14,
                  background: "rgba(15,23,42,1)",
                  color: "#e5e7eb",
                  outline: "none",
                }}
              />
              <button
                type="submit"
                disabled={!joinCode.trim()}
                style={{
                  borderRadius: 999,
                  padding: "8px 16px",
                  border: "none",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: joinCode.trim() ? "pointer" : "not-allowed",
                  background: joinCode.trim()
                    ? "linear-gradient(135deg,#22c55e,#4ade80)"
                    : "rgba(55,65,81,0.9)",
                  color: joinCode.trim() ? "#020617" : "#9ca3af",
                }}
              >
                Join
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


