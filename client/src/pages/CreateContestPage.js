// src/pages/CreateContestPage.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

const API_URL = "http://localhost:5000";

function CreateContestPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [problems, setProblems] = useState([]);
  const [selectedProblemIds, setSelectedProblemIds] = useState([]);

  const [loadingProblems, setLoadingProblems] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/login", {
        state: { from: "/contests/new", message: "You must be logged in" },
      });
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    async function fetchProblems() {
      try {
        setLoadingProblems(true);
        const res = await axios.get(`${API_URL}/problems`);
        setProblems(res.data || []);
      } catch (err) {
        console.error("Load problems error", err);
        setError("Failed to load problems for selection.");
      } finally {
        setLoadingProblems(false);
      }
    }
    fetchProblems();
  }, []);

  function toggleProblem(id) {
    setSelectedProblemIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  async function handleCreateContest(e) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!name.trim() || !startTime || !endTime || selectedProblemIds.length === 0) {
      setError("Please fill all required fields and select at least one problem.");
      return;
    }

    const startISO = new Date(startTime).toISOString();
    const endISO = new Date(endTime).toISOString();

    if (new Date(startISO) >= new Date(endISO)) {
      setError("End time must be after start time.");
      return;
    }

    try {
      setCreating(true);
      const payload = {
        name: name.trim(),
        description: description.trim(),
        startTime: startISO,
        endTime: endISO,
        problemIds: selectedProblemIds,
      };

      await axios.post(`${API_URL}/contests`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccessMsg("Contest created successfully!");
      setTimeout(() => {
        navigate("/contests");
      }, 800);
    } catch (err) {
      console.error("Create contest error:", err);
      setError(
        err.response?.data?.message || "Error creating contest. Try again."
      );
    } finally {
      setCreating(false);
    }
  }

  if (!user) return null;

  return (
    <div className="page-container">
      <div className="page-card">
        <div className="page-card-header">
          <div>
            <h1 className="page-heading">Create a New Contest</h1>
            <p className="page-subtitle">
              Configure a new coding contest with selected problems & schedule.
            </p>
          </div>
          <Link to="/contests" className="btn btn-secondary">
            Back to Contests
          </Link>
        </div>

        {error && <p className="page-error">{error}</p>}
        {successMsg && <p className="page-success">{successMsg}</p>}

        <form className="contest-form" onSubmit={handleCreateContest}>
          <div className="contest-form-grid">
            {/* LEFT SIDE */}
            <div className="contest-field">
              <label className="auth-label">
                Contest Name <span className="required-star">*</span>
              </label>
              <input
                className="input-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. CodeGen Weekly #1"
              />

              <label className="auth-label" style={{ marginTop: "0.8rem" }}>
                Description
              </label>
              <textarea
                className="input-control"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description of this contest..."
              />

              <div className="datetime-row">
                <div>
                  <label className="auth-label">
                    Start Time <span className="required-star">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    className="input-control"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div>
                  <label className="auth-label">
                    End Time <span className="required-star">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    className="input-control"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* RIGHT SIDE */}
            <div className="contest-field">
              <label className="auth-label">
                Select Problems <span className="required-star">*</span>
              </label>
              <p className="page-muted" style={{ marginBottom: "0.5rem" }}>
                Choose one or more problems that will be part of this contest.
              </p>

              {loadingProblems ? (
                <p className="page-muted">Loading problems...</p>
              ) : problems.length === 0 ? (
                <p className="page-muted">
                  No problems found. Seed some problems first.
                </p>
              ) : (
                <div className="contest-problems-list">
                  {problems.map((p) => (
                    <label key={p._id} className="problem-checkbox-item">
                      <input
                        type="checkbox"
                        checked={selectedProblemIds.includes(p._id)}
                        onChange={() => toggleProblem(p._id)}
                      />
                      <span className="problem-checkbox-text">
                        <span className="problem-title-line">
                          {p.title}
                          {p.difficulty && (
                            <span
                              className={`pill pill-${p.difficulty.toLowerCase()}`}
                            >
                              {p.difficulty}
                            </span>
                          )}
                        </span>
                        <span className="problem-meta-line">
                          {p.slug} {p.tags?.length ? `• ${p.tags.join(", ")}` : ""}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="contest-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={creating}
            >
              {creating ? "Creating..." : "Create Contest"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateContestPage;
