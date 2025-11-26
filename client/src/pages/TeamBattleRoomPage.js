// client/src/pages/TeamBattleRoomPage.js
import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { io } from "socket.io-client";

const API_URL = "http://localhost:5000";

let socket;

function TeamBattleRoomPage() {
  const { battleId } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [battle, setBattle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  // fetch battle info
  useEffect(() => {
    if (!token || !battleId) return;

    async function fetchBattle() {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/team-battles/${battleId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBattle(res.data);
      } catch (err) {
        console.error("Fetch battle error:", err);
        setError(
          err.response?.data?.message || "Failed to load team battle room."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchBattle();
  }, [battleId, token]);

  // socket: join room + listen for score updates
  useEffect(() => {
    if (!battleId || !user) return;

    socket = io(API_URL, {
      transports: ["websocket"],
    });

    socket.emit("join_team_battle", { battleId });

    socket.on("team-battle:score-update", (payload) => {
      if (payload.battleId === battleId) {
        setBattle((prev) =>
          prev
            ? {
                ...prev,
                teamA: payload.teamA || prev.teamA,
                teamB: payload.teamB || prev.teamB,
                participants: payload.participants || prev.participants,
                status: payload.status || prev.status,
              }
            : prev
        );
      }
    });

    return () => {
      if (socket) socket.disconnect();
    };
  }, [battleId, user]);

  // countdown timer
  useEffect(() => {
    if (!battle || !battle.startTime || !battle.timeLimitSeconds) {
      setTimeLeft(null);
      return;
    }

    const start = new Date(battle.startTime).getTime();
    const end = start + battle.timeLimitSeconds * 1000;

    function tick() {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((end - now) / 1000));
      setTimeLeft(remaining);
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [battle]);

  const formattedTimeLeft = useMemo(() => {
    if (timeLeft == null) return "--:--";
    const mm = String(Math.floor(timeLeft / 60)).padStart(2, "0");
    const ss = String(timeLeft % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  }, [timeLeft]);

  if (!user) return null;

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-card">
          <p className="page-muted">Loading battle...</p>
        </div>
      </div>
    );
  }

  if (error || !battle) {
    return (
      <div className="page-container">
        <div className="page-card">
          <h1 className="page-heading">Team Battle Room</h1>
          <p className="page-error">{error || "Battle not found."}</p>
        </div>
      </div>
    );
  }

  const isFinished = battle.status === "finished";
  const teamAScore = battle.teamA?.score || 0;
  const teamBScore = battle.teamB?.score || 0;
  const teamALead = teamAScore > teamBScore;
  const teamBLead = teamBScore > teamAScore;

  // ---------- styles ----------
  const page = {
    minHeight: "100vh",
    padding: "32px 48px",
    background: "#020617",
    color: "#e5e7eb",
  };

  const card = {
    maxWidth: 1100,
    margin: "0 auto",
    background:
      "radial-gradient(circle at top, rgba(34,197,94,0.18), transparent 60%), #020617",
    borderRadius: 28,
    padding: 24,
    border: "1px solid #111827",
    boxShadow: "0 30px 80px rgba(0,0,0,0.95)",
  };

  const headerRow = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 24,
  };

  const title = {
    fontSize: 32,
    fontWeight: 800,
    letterSpacing: 0.3,
    background:
      "linear-gradient(120deg, #22c55e, #a855f7, #38bdf8)",
    WebkitBackgroundClip: "text",
    color: "transparent",
  };

  const subtitle = {
    marginTop: 4,
    fontSize: 14,
    color: "#9ca3af",
  };

  const timerBox = {
    minWidth: 140,
    textAlign: "right",
  };

  const timerChip = {
    display: "inline-flex",
    alignItems: "center",
    padding: "3px 10px",
    borderRadius: 999,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    border: isFinished
      ? "1px solid rgba(148,163,184,0.8)"
      : "1px solid rgba(52,211,153,0.8)",
    background: isFinished
      ? "rgba(15,23,42,0.9)"
      : "rgba(16,185,129,0.15)",
    color: isFinished ? "#9ca3af" : "#4ade80",
    gap: 6,
  };

  const timerValue = {
    marginTop: 6,
    fontSize: 22,
    fontWeight: 700,
    color: "#fefce8",
  };

  const sectionTitle = {
    fontSize: 15,
    textTransform: "uppercase",
    letterSpacing: 0.14,
    color: "#22c55e",
    textAlign: "center",
    marginBottom: 12,
  };

  const problemsCard = {
    borderRadius: 18,
    border: "1px solid #0f172a",
    background: "rgba(2,6,23,0.96)",
    padding: 14,
    marginBottom: 18,
  };

  const problemRow = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 14px",
    borderRadius: 12,
    background:
      "linear-gradient(135deg, rgba(15,23,42,0.9), rgba(15,23,42,0.7))",
    border: "1px solid rgba(31,41,55,0.9)",
  };

  const difficultyPill = {
    display: "inline-flex",
    alignItems: "center",
    padding: "2px 8px",
    borderRadius: 999,
    fontSize: 11,
    border: "1px solid rgba(59,130,246,0.65)",
    color: "#93c5fd",
    background: "rgba(15,23,42,0.9)",
  };

  const openBtn = {
    fontSize: 12,
    padding: "4px 12px",
    borderRadius: 999,
    border: "1px solid rgba(94,234,212,0.7)",
    background:
      "linear-gradient(135deg, rgba(56,189,248,0.15), rgba(45,212,191,0.25))",
    color: "#e0f2fe",
    cursor: "pointer",
  };

  const divider = {
    margin: "16px 0 10px",
    borderTop: "1px solid rgba(31,41,55,0.9)",
  };

  const layoutRow = {
    display: "grid",
    gridTemplateColumns: "minmax(0, 2fr) minmax(0, 3fr)",
    gap: 18,
    marginTop: 10,
  };

  const scoreboardCard = {
    borderRadius: 18,
    border: "1px solid #0f172a",
    background:
      "linear-gradient(145deg, rgba(15,23,42,0.98), rgba(15,23,42,0.96))",
    padding: 14,
  };

  const teamRow = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  };

  const teamCardBase = {
    borderRadius: 14,
    padding: 12,
    border: "1px solid rgba(31,41,55,0.9)",
    background:
      "radial-gradient(circle at top, rgba(17,24,39,0.95), rgba(15,23,42,0.98))",
  };

  const teamName = {
    fontSize: 15,
    fontWeight: 600,
    marginBottom: 6,
  };

  const teamScoreValue = {
    fontSize: 26,
    fontWeight: 800,
  };

  const teamMeta = {
    marginTop: 4,
    fontSize: 12,
    color: "#9ca3af",
  };

  const membersCard = {
    borderRadius: 18,
    border: "1px solid #0f172a",
    background: "rgba(2,6,23,0.96)",
    padding: 14,
    marginTop: 10,
  };

  const memberList = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 10,
    marginTop: 8,
  };

  const memberCardBase = {
    borderRadius: 12,
    padding: 10,
    border: "1px solid rgba(31,41,55,0.9)",
    background:
      "radial-gradient(circle at top, rgba(15,23,42,0.98), rgba(15,23,42,0.96))",
    fontSize: 12,
  };

  const badge = {
    display: "inline-flex",
    alignItems: "center",
    padding: "1px 8px",
    borderRadius: 999,
    fontSize: 11,
    marginLeft: 6,
  };

  // ---------- UI ----------
  return (
    <div style={page}>
      <div style={card}>
        {/* Header */}
        <div style={headerRow}>
          <div>
            <h1 style={title}>Team Battle Room</h1>
            <p style={subtitle}>
              Battle between{" "}
              <span style={{ fontWeight: 600 }}>
                {battle.teamA?.team?.name || "Team A"}
              </span>{" "}
              and{" "}
              <span style={{ fontWeight: 600 }}>
                {battle.teamB?.team?.name || "Team B"}
              </span>
              .
            </p>
          </div>

          <div style={timerBox}>
            <div style={timerChip}>
              {!isFinished ? (
                <>
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#4ade80",
                      boxShadow: "0 0 8px #22c55e",
                    }}
                  />
                  <span>Live</span>
                </>
              ) : (
                <>
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#9ca3af",
                    }}
                  />
                  <span>Finished</span>
                </>
              )}
            </div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 6 }}>
              Time left
            </div>
            <div style={timerValue}>{formattedTimeLeft}</div>
          </div>
        </div>

        {/* Problems */}
        <div style={problemsCard}>
          <div style={sectionTitle}>Problems</div>
          {battle.problems?.length === 0 ? (
            <p style={{ fontSize: 13, color: "#9ca3af", textAlign: "center" }}>
              No problems configured for this battle.
            </p>
          ) : (
            battle.problems.map((p) => (
              <div key={p._id} style={problemRow}>
                <div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      marginBottom: 2,
                    }}
                  >
                    {p.title}
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={difficultyPill}>{p.difficulty}</span>
                  </div>
                </div>
                <button
                  style={openBtn}
                  onClick={() =>
                    navigate(`/problems/${p.slug}`, {
                      state: { battleId: battle._id },
                    })
                  }
                >
                  Open
                </button>
              </div>
            ))
          )}
        </div>

        <div style={divider} />

        {/* Layout: left = scoreboard, right = members */}
        <div style={layoutRow}>
          {/* Scoreboard */}
          <div style={scoreboardCard}>
            <div style={{ ...sectionTitle, marginBottom: 10 }}>
              Scoreboard
            </div>
            <div style={teamRow}>
              {/* Team A */}
              <div
                style={{
                  ...teamCardBase,
                  borderColor: teamALead
                    ? "rgba(34,197,94,0.9)"
                    : "rgba(31,41,55,0.9)",
                  boxShadow: teamALead
                    ? "0 0 24px rgba(34,197,94,0.35)"
                    : "none",
                }}
              >
                <div style={teamName}>
                  {battle.teamA?.team?.name || "Team A"}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 6,
                  }}
                >
                  <span style={teamScoreValue}>{teamAScore}</span>
                  <span
                    style={{
                      fontSize: 11,
                      color: "#9ca3af",
                      textTransform: "uppercase",
                    }}
                  >
                    pts
                  </span>
                </div>
                <div style={teamMeta}>
                  Solved:{" "}
                  <span style={{ color: "#e5e7eb" }}>
                    {battle.teamA?.solved || 0}
                  </span>
                </div>
              </div>

              {/* Team B */}
              <div
                style={{
                  ...teamCardBase,
                  borderColor: teamBLead
                    ? "rgba(56,189,248,0.9)"
                    : "rgba(31,41,55,0.9)",
                  boxShadow: teamBLead
                    ? "0 0 24px rgba(56,189,248,0.4)"
                    : "none",
                }}
              >
                <div style={teamName}>
                  {battle.teamB?.team?.name || "Team B"}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 6,
                  }}
                >
                  <span style={teamScoreValue}>{teamBScore}</span>
                  <span
                    style={{
                      fontSize: 11,
                      color: "#9ca3af",
                      textTransform: "uppercase",
                    }}
                  >
                    pts
                  </span>
                </div>
                <div style={teamMeta}>
                  Solved:{" "}
                  <span style={{ color: "#e5e7eb" }}>
                    {battle.teamB?.solved || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Members */}
          <div style={membersCard}>
            <div style={{ ...sectionTitle, marginBottom: 6 }}>Members</div>
            {(!battle.participants || battle.participants.length === 0) && (
              <p style={{ fontSize: 13, color: "#9ca3af" }}>
                No participants registered.
              </p>
            )}
            <div style={memberList}>
              {battle.participants?.map((p, idx) => {
                const userObj =
                  p.user && typeof p.user === "object" ? p.user : null;
                const username =
                  userObj?.username ||
                  p.username ||
                  p.email ||
                  `Player ${idx + 1}`;
                const key =
                  userObj?._id || p._id || `${p.teamSide || "X"}-${idx}`;
                const isTeamA = p.teamSide === "A";

                return (
                  <div
                    key={key}
                    style={{
                      ...memberCardBase,
                      borderColor: isTeamA
                        ? "rgba(34,197,94,0.45)"
                        : "rgba(59,130,246,0.45)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        marginBottom: 4,
                      }}
                    >
                      {username}
                      <span
                        style={{
                          ...badge,
                          border: isTeamA
                            ? "1px solid rgba(34,197,94,0.8)"
                            : "1px solid rgba(59,130,246,0.8)",
                          background: isTeamA
                            ? "rgba(21,128,61,0.25)"
                            : "rgba(30,64,175,0.35)",
                          color: isTeamA ? "#4ade80" : "#93c5fd",
                        }}
                      >
                        Team {p.teamSide || "?"}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 11,
                        color: "#9ca3af",
                      }}
                    >
                      <span>
                        Score:{" "}
                        <span style={{ color: "#e5e7eb" }}>
                          {p.score ?? 0}
                        </span>
                      </span>
                      <span>
                        Solved:{" "}
                        <span style={{ color: "#e5e7eb" }}>
                          {p.solved ?? 0}
                        </span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {isFinished && (
          <div
            style={{
              marginTop: 18,
              padding: "10px 14px",
              borderRadius: 14,
              border: "1px solid rgba(55,65,81,0.9)",
              background: "rgba(15,23,42,0.96)",
              fontSize: 13,
              textAlign: "center",
              color: "#e5e7eb",
            }}
          >
            {battle.winner === "draw" && "Result: it's a draw."}
            {battle.winner === "A" && (
              <>
                Winner:{" "}
                <span style={{ fontWeight: 600 }}>
                  {battle.teamA?.team?.name || "Team A"}
                </span>
              </>
            )}
            {battle.winner === "B" && (
              <>
                Winner:{" "}
                <span style={{ fontWeight: 600 }}>
                  {battle.teamB?.team?.name || "Team B"}
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default TeamBattleRoomPage;
