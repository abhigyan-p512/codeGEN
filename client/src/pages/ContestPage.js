// src/pages/ContestPage.js
import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API_URL = "http://localhost:5000";

function ContestPage() {
  const { id } = useParams();
  const { user, token } = useAuth();

  const [contest, setContest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);

  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingLb, setLoadingLb] = useState(false);
  const [lbError, setLbError] = useState("");

  // ⏱ countdown state
  const [now, setNow] = useState(Date.now());

  // Fetch contest
  useEffect(() => {
    async function fetchContest() {
      try {
        setLoading(true);
        setError("");
        const res = await axios.get(`${API_URL}/contests/${id}`);
        setContest(res.data);
      } catch (err) {
        console.error("Get contest error:", err.response?.data || err.message);
        setError("Failed to load contest.");
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchContest();
  }, [id]);

  // Fetch leaderboard
  useEffect(() => {
    if (!user || !id) return;

    async function fetchLeaderboard() {
      try {
        setLoadingLb(true);
        setLbError("");
        const res = await axios.get(`${API_URL}/contests/${id}/leaderboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLeaderboard(res.data || []);
      } catch (err) {
        console.error(
          "Leaderboard error:",
          err.response?.data || err.message
        );
        setLbError("Failed to load leaderboard.");
      } finally {
        setLoadingLb(false);
      }
    }

    fetchLeaderboard();
  }, [id, user, token]);

  // ⏱ keep "now" ticking each second
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // contest state: upcoming / running / ended
  const contestState = useMemo(() => {
    if (!contest) return "loading";
    const start = new Date(contest.startTime).getTime();
    const end = new Date(contest.endTime).getTime();
    const current = now;

    if (current < start) return "upcoming";
    if (current >= start && current <= end) return "running";
    return "ended";
  }, [contest, now]);

  // human-readable countdown
  const countdownText = useMemo(() => {
    if (!contest) return "";

    const start = new Date(contest.startTime).getTime();
    const end = new Date(contest.endTime).getTime();
    const current = now;

    let diff;
    let prefix;

    if (current < start) {
      diff = start - current;
      prefix = "Starts in";
    } else if (current >= start && current <= end) {
      diff = end - current;
      prefix = "Ends in";
    } else {
      return "Contest finished";
    }

    const sec = Math.floor(diff / 1000);
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;

    return `${prefix} ${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }, [contest, now]);

  const handleJoin = async () => {
    if (!user) {
      alert("You must be logged in to join this contest.");
      return;
    }

    try {
      setJoining(true);
      await axios.post(
        `${API_URL}/contests/${id}/join`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setJoined(true);
      alert("Joined contest!");
    } catch (err) {
      console.error("Join contest error:", err.response?.data || err.message);
      alert(
        err.response?.data?.message || "Failed to join contest. Try again."
      );
    } finally {
      setJoining(false);
    }
  };

  const safeProblems = useMemo(() => {
    if (!contest || !contest.problems) return [];
    return contest.problems.filter(
      (p) => p && p.problem && p.problem.slug && p.problem.title
    );
  }, [contest]);

  const formatDateTime = (str) => {
    if (!str) return "-";
    return new Date(str).toLocaleString();
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-card">
          <p className="page-muted">Loading contest...</p>
        </div>
      </div>
    );
  }

  if (error || !contest) {
    return (
      <div className="page-container">
        <div className="page-card">
          <p className="page-error">{error || "Contest not found."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-card">
        {/* Header */}
        <div className="page-card-header">
          <div>
            <h1 className="page-heading">{contest.name}</h1>
            <p className="page-subtitle">{contest.description}</p>

            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: "0.8rem", opacity: 0.8 }}>
                <strong>Starts:</strong> {formatDateTime(contest.startTime)}
              </div>
              <div style={{ fontSize: "0.8rem", opacity: 0.8 }}>
                <strong>Ends:</strong> {formatDateTime(contest.endTime)}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {/* contest state pill */}
            <div style={{ alignSelf: "flex-end" }}>
              {contestState === "upcoming" && (
                <span className="pill pill-muted">Upcoming</span>
              )}
              {contestState === "running" && (
                <span className="pill pill-easy">Live</span>
              )}
              {contestState === "ended" && (
                <span className="pill pill-hard">Ended</span>
              )}
            </div>

            {/* countdown */}
            <div
              style={{
                fontSize: "0.85rem",
                textAlign: "right",
                opacity: 0.9,
              }}
            >
              {countdownText}
            </div>

            {/* join button */}
            <button
              className="btn btn-primary"
              onClick={handleJoin}
              disabled={joining || contestState === "ended"}
            >
              {joining
                ? "Joining..."
                : joined
                ? "Joined"
                : contestState === "ended"
                ? "Contest Ended"
                : "Join Contest"}
            </button>
          </div>
        </div>

        {/* Problems table */}
        <h2 style={{ marginTop: "1rem", marginBottom: "0.5rem" }}>
          Problems
        </h2>

        {safeProblems.length === 0 ? (
          <p className="page-muted">
            No valid problems linked to this contest yet.
          </p>
        ) : (
          <div className="submissions-table-wrapper">
            <table className="submissions-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Difficulty</th>
                  <th>Open</th>
                </tr>
              </thead>
              <tbody>
                {safeProblems.map((p, idx) => (
                  <tr key={p.problem._id || idx}>
                    <td>{p.problem.title}</td>
                    <td>
                      <span
                        className={
                          p.problem.difficulty
                            ? `pill pill-${p.problem.difficulty.toLowerCase()}`
                            : "pill pill-muted"
                        }
                      >
                        {p.problem.difficulty || "Unknown"}
                      </span>
                    </td>
                    <td>
                      {contestState === "ended" ? (
                        <span className="page-muted">Contest ended</span>
                      ) : (
                        <Link
                          className="btn btn-ghost-sm"
                          to={`/contests/${contest._id}/problems/${p.problem.slug}`}
                        >
                          Solve
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Leaderboard */}
        <h2 style={{ marginTop: "1.5rem", marginBottom: "0.5rem" }}>
          Leaderboard
        </h2>

        {!user && (
          <p className="page-muted">
            Log in to view the live leaderboard for this contest.
          </p>
        )}

        {user && loadingLb && (
          <p className="page-muted">Loading leaderboard...</p>
        )}

        {user && lbError && <p className="page-error">{lbError}</p>}

        {user && !loadingLb && !lbError && leaderboard.length === 0 && (
          <p className="page-muted">No submissions yet.</p>
        )}

        {user && !loadingLb && leaderboard.length > 0 && (
          <div className="submissions-table-wrapper">
            <table className="submissions-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>User</th>
                  <th>Score</th>
                  <th>Solved</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, index) => (
                  <tr key={entry.userId || index}>
                    <td>{index + 1}</td>
                    <td>{entry.username}</td>
                    <td>{entry.score}</td>
                    <td>{entry.solvedCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ContestPage;
