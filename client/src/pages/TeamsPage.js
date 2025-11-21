// src/pages/TeamsPage.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5000";

function TeamsPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [myTeams, setMyTeams] = useState([]);
  const [loadingMyTeams, setLoadingMyTeams] = useState(true);

  const [teamName, setTeamName] = useState("");
  const [memberIds, setMemberIds] = useState("");
  const [joinTeamId, setJoinTeamId] = useState("");

  const [message, setMessage] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  useEffect(() => {
    if (!token) return;
    async function fetchMyTeams() {
      try {
        setLoadingMyTeams(true);
        const res = await axios.get(`${API_URL}/teams/mine`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMyTeams(res.data || []);
      } catch (err) {
        console.error("Fetch my teams error:", err);
        setMessage("Failed to load your teams.");
      } finally {
        setLoadingMyTeams(false);
      }
    }
    fetchMyTeams();
  }, [token]);

  async function handleCreateTeam(e) {
    e.preventDefault();
    setMessage("");
    if (!teamName.trim()) {
      setMessage("Team name is required.");
      return;
    }

    try {
      setCreating(true);
      const ids =
        memberIds.trim().length > 0
          ? memberIds
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [];

      const res = await axios.post(
        `${API_URL}/teams`,
        { name: teamName.trim(), memberIds: ids },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage("Team created successfully.");
      setTeamName("");
      setMemberIds("");
      setMyTeams((prev) => [...prev, res.data]);
    } catch (err) {
      console.error("Create team error:", err);
      setMessage(
        err.response?.data?.message || "Failed to create team. Try again."
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleJoinById(e) {
    e.preventDefault();
    setMessage("");

    if (!joinTeamId.trim()) {
      setMessage("Please enter a Team ID.");
      return;
    }

    try {
      setJoining(true);
      await axios.post(
        `${API_URL}/teams/${joinTeamId.trim()}/join`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage("Joined team successfully.");
      setJoinTeamId("");

      const res = await axios.get(`${API_URL}/teams/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMyTeams(res.data || []);
    } catch (err) {
      console.error("Join team error:", err);
      setMessage(
        err.response?.data?.message || "Failed to join team. Check Team ID."
      );
    } finally {
      setJoining(false);
    }
  }

  if (!user) return null;

  return (
    <div className="page-container">
      <div className="page-card">
        <div className="page-header">
          <div>
            <h1 className="page-heading">Teams</h1>
            <p className="page-subtitle">
              Create a team or join one using a Team ID. Teams can fight in{" "}
              <b>Team Battles</b>.
            </p>
          </div>
          <button
            className="btn btn-secondary"
            onClick={() => navigate("/team-battle")}
          >
            Go to Team Battle
          </button>
        </div>

        {message && (
          <p
            className={
              message.toLowerCase().includes("fail")
                ? "page-error"
                : "page-muted"
            }
          >
            {message}
          </p>
        )}

        <div className="teams-grid">
          {/* Create team */}
          <div className="teams-card">
            <h3 className="section-title">Create Team</h3>
            <form onSubmit={handleCreateTeam} className="auth-form">
              <div className="auth-field">
                <label className="auth-label">Team Name</label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="input-control"
                  placeholder="e.g. Bit Busters"
                />
              </div>
              <div className="auth-field">
                <label className="auth-label">
                  Member IDs (optional, comma separated)
                </label>
                <textarea
                  value={memberIds}
                  onChange={(e) => setMemberIds(e.target.value)}
                  className="input-control"
                  placeholder="UserId1, UserId2, ..."
                  rows={3}
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary auth-btn"
                disabled={creating}
              >
                {creating ? "Creating..." : "Create Team"}
              </button>
            </form>
          </div>

          {/* Join team */}
          <div className="teams-card">
            <h3 className="section-title">Join Team by ID</h3>
            <form onSubmit={handleJoinById} className="auth-form">
              <div className="auth-field">
                <label className="auth-label">Team ID</label>
                <input
                  type="text"
                  value={joinTeamId}
                  onChange={(e) => setJoinTeamId(e.target.value)}
                  className="input-control"
                  placeholder="Paste Team ID here"
                />
              </div>
              <button
                type="submit"
                className="btn btn-secondary auth-btn"
                disabled={joining}
              >
                {joining ? "Joining..." : "Join Team"}
              </button>
            </form>
            <p className="page-muted" style={{ marginTop: "0.6rem" }}>
              Ask your friend or admin to share the Team ID with you.
            </p>
          </div>
        </div>

        {/* My teams list */}
        <h3 className="section-title" style={{ marginTop: "2rem" }}>
          My Teams
        </h3>
        {loadingMyTeams ? (
          <p className="page-muted">Loading your teams...</p>
        ) : myTeams.length === 0 ? (
          <p className="page-muted">You are not part of any team yet.</p>
        ) : (
          <div className="teams-list">
            {myTeams.map((team) => (
              <div key={team._id} className="team-pill-card">
                <div>
                  <div className="team-name-row">
                    <span className="team-name">{team.name}</span>
                    <span className="team-id">ID: {team._id}</span>
                  </div>
                  <p className="team-members">
                    Members:{" "}
                    {team.members?.map((m) => m.username).join(", ") ||
                      "Unknown"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TeamsPage;
