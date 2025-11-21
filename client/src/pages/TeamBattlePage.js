// src/pages/TeamBattlePage.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";



const API_URL = "http://localhost:5000";

function TeamBattlePage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

useEffect(() => {
  if (!user) {
    navigate("/login", { state: { from: location.pathname } });
  }
}, [user, navigate, location.pathname]);


  const [teams, setTeams] = useState([]);
  const [problems, setProblems] = useState([]);

  const [loadingTeams, setLoadingTeams] = useState(true);
  const [loadingProblems, setLoadingProblems] = useState(true);

  const [teamAId, setTeamAId] = useState("");
  const [teamBId, setTeamBId] = useState("");
  const [selectedProblemIds, setSelectedProblemIds] = useState([]);
  const [durationMinutes, setDurationMinutes] = useState(90);

  const [message, setMessage] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  useEffect(() => {
    if (!token) return;

    async function fetchTeams() {
      try {
        setLoadingTeams(true);
        const res = await axios.get(`${API_URL}/teams`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTeams(res.data || []);
      } catch (err) {
        console.error("Fetch teams error:", err);
        setMessage("Failed to load teams.");
      } finally {
        setLoadingTeams(false);
      }
    }

    fetchTeams();
  }, [token]);

  useEffect(() => {
    async function fetchProblems() {
      try {
        setLoadingProblems(true);
        const res = await axios.get(`${API_URL}/problems`);
        setProblems(res.data || []);
      } catch (err) {
        console.error("Fetch problems error:", err);
        setMessage("Failed to load problems.");
      } finally {
        setLoadingProblems(false);
      }
    }
    fetchProblems();
  }, []);

  function toggleProblemSelection(problemId) {
    setSelectedProblemIds((prev) =>
      prev.includes(problemId)
        ? prev.filter((id) => id !== problemId)
        : [...prev, problemId]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");

    if (!teamAId || !teamBId || teamAId === teamBId) {
      setMessage("Please select two different teams.");
      return;
    }
    if (selectedProblemIds.length === 0) {
      setMessage("Select at least one problem.");
      return;
    }
    if (!durationMinutes || durationMinutes <= 0) {
      setMessage("Duration must be a positive number.");
      return;
    }

    try {
      setCreating(true);

      const res = await axios.post(
        `${API_URL}/matches/team`,
        {
          teamAId,
          teamBId,
          problemIds: selectedProblemIds,
          durationMinutes: Number(durationMinutes),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage("Team battle created! Redirecting...");
      const contestId = res.data.contest._id;
      navigate(`/contests/${contestId}`);
    } catch (err) {
      console.error("Create team match error:", err);
      setMessage(
        err.response?.data?.message || "Failed to create team battle."
      );
    } finally {
      setCreating(false);
    }
  }

  if (!user) return null;

  return (
    <div className="page-container">
      <div className="page-card">
        <div className="page-header">
          <div>
            <h1 className="page-heading">Team Battle</h1>
            <p className="page-subtitle">
              Pick two teams, choose problems and start a team vs team war.
            </p>
          </div>
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

        <form onSubmit={handleSubmit} className="team-battle-form">
          <div className="team-battle-row">
            <div className="team-select-column">
              <label className="auth-label">Team A</label>
              {loadingTeams ? (
                <p className="page-muted">Loading teams...</p>
              ) : (
                <select
                  value={teamAId}
                  onChange={(e) => setTeamAId(e.target.value)}
                  className="select-control"
                >
                  <option value="">Select Team A</option>
                  {teams.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="team-select-column">
              <label className="auth-label">Team B</label>
              {loadingTeams ? (
                <p className="page-muted">Loading teams...</p>
              ) : (
                <select
                  value={teamBId}
                  onChange={(e) => setTeamBId(e.target.value)}
                  className="select-control"
                >
                  <option value="">Select Team B</option>
                  {teams.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="duration-column">
              <label className="auth-label">Duration (minutes)</label>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="input-control"
                min={1}
              />
            </div>
          </div>

          <div className="problems-select-column">
            <label className="auth-label">Select Problems</label>
            {loadingProblems ? (
              <p className="page-muted">Loading problems...</p>
            ) : problems.length === 0 ? (
              <p className="page-muted">No problems available.</p>
            ) : (
              <div className="battle-problems-list">
                {problems.map((p) => (
                  <label key={p._id} className="battle-problem-item">
                    <input
                      type="checkbox"
                      checked={selectedProblemIds.includes(p._id)}
                      onChange={() => toggleProblemSelection(p._id)}
                    />
                    <span>
                      {p.title}{" "}
                      <span className="chip chip-small">{p.difficulty}</span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={creating}
          >
            {creating ? "Creating battle..." : "Start Team Battle"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default TeamBattlePage;
