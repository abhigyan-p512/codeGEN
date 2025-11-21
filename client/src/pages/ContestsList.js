// src/pages/ContestsList.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API_URL = "http://localhost:5000";

function ContestsList() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchContests() {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/contests`);
        setContests(res.data || []);
      } catch (err) {
        console.error(
          "Error loading contests:",
          err.response?.data || err.message
        );
        setError("Failed to load contests.");
      } finally {
        setLoading(false);
      }
    }
    fetchContests();
  }, []);

  const handleJoin = async (id) => {
    if (!user) {
      navigate("/login", {
        state: { from: "/contests", message: "You must be logged in" },
      });
      return;
    }

    try {
      await axios.post(
        `${API_URL}/contests/${id}/join`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert("Joined contest!");
    } catch (err) {
      console.error("Join contest error:", err);
      alert("Failed to join contest");
    }
  };

  const formatDateTime = (str) => {
    if (!str) return "-";
    return new Date(str).toLocaleString();
  };

  return (
    <div className="page-container">
      <div className="page-card">
        <div className="page-card-header">
          <div>
            <h1 className="page-heading">Contests</h1>
            <p className="page-subtitle">
              Compete in timed contests and track your performance.
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Link to="/contests/new" className="btn btn-primary">
              + Create Contest
            </Link>
          </div>
        </div>

        {loading && <p className="page-muted">Loading contests...</p>}
        {error && <p className="page-error">{error}</p>}

        {!loading && contests.length === 0 && !error && (
          <div className="empty-state">
            <p>No contests yet.</p>
            <p className="page-muted">
              Be the first to create one and invite your friends.
            </p>
          </div>
        )}

        {!loading && contests.length > 0 && (
          <div className="submissions-table-wrapper">
            <table className="submissions-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Schedule</th>
                  <th>Description</th>
                  <th>Open</th>
                  <th>Join</th>
                </tr>
              </thead>
              <tbody>
                {contests.map((c) => (
                  <tr key={c._id}>
                    <td>{c.name}</td>
                    <td>
                      <div style={{ fontSize: "0.8rem" }}>
                        <div>
                          <strong>From:</strong> {formatDateTime(c.startTime)}
                        </div>
                        <div>
                          <strong>To:</strong> {formatDateTime(c.endTime)}
                        </div>
                      </div>
                    </td>
                    <td style={{ maxWidth: 260 }}>
                      <span className="page-muted">
                        {c.description || "No description"}
                      </span>
                    </td>
                    <td>
                      <Link
                        to={`/contests/${c._id}`}
                        className="btn btn-ghost-sm"
                      >
                        View
                      </Link>
                    </td>
                    <td>
                      <button
                        className="btn btn-ghost-sm"
                        onClick={() => handleJoin(c._id)}
                      >
                        Join
                      </button>
                    </td>
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

export default ContestsList;
