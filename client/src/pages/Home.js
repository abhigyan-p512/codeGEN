// src/pages/Home.js
import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5000";

function Home() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("All");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    async function fetchProblems() {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/problems`);
        setProblems(res.data || []);
      } catch (err) {
        console.error("Error loading problems:", err);
        setError("Failed to load problems. Make sure the server is running.");
      } finally {
        setLoading(false);
      }
    }
    fetchProblems();
  }, []);

  const difficultyColorClass = (d) => {
    switch (d) {
      case "Easy":
        return "diff-pill diff-easy";
      case "Medium":
        return "diff-pill diff-medium";
      case "Hard":
        return "diff-pill diff-hard";
      default:
        return "diff-pill";
    }
  };

  const filteredProblems = useMemo(
    () =>
      problems.filter((p) => {
        const matchesSearch =
          p.title.toLowerCase().includes(search.toLowerCase()) ||
          p.slug.toLowerCase().includes(search.toLowerCase());

        const matchesDifficulty =
          difficulty === "All" || p.difficulty === difficulty;

        return matchesSearch && matchesDifficulty;
      }),
    [problems, search, difficulty]
  );

  return (
    <div className="page-container">
      <div className="page-card problems-page-card">
        <div className="page-header">
          <div>
            <h1 className="page-heading">Problems</h1>
            <p className="page-subtitle">
              Practice coding questions with auto-judge and detailed testcases.
            </p>
          </div>
        </div>

        {/* Search + filter */}
        <div className="problems-controls">
          <div className="problems-search">
            <input
              type="text"
              placeholder="Search problems..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-control"
            />
          </div>

          <div className="problems-filter">
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="select-control"
            >
              <option value="All">All difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
        </div>

        {/* Status / list */}
        {error && <p className="page-error">{error}</p>}

        {loading ? (
          <p className="page-muted">Loading problems...</p>
        ) : filteredProblems.length === 0 ? (
          <p className="page-muted">No problems found for this filter.</p>
        ) : (
          <div className="problems-list">
            {filteredProblems.map((problem) => (
              <button
                key={problem._id}
                className="problem-card-row"
                onClick={() => navigate(`/problems/${problem.slug}`)}
              >
                <div className="problem-main">
                  <span className="problem-title">{problem.title}</span>
                  {problem.tags && problem.tags.length > 0 && (
                    <span className="problem-tags">
                      {problem.tags.slice(0, 3).join(" • ")}
                    </span>
                  )}
                </div>
                <div className="problem-meta">
                  <span className={difficultyColorClass(problem.difficulty)}>
                    {problem.difficulty || "—"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;
