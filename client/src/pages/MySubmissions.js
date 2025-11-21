// client/src/pages/MySubmissions.js
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

const statusColors = {
  Accepted: { bg: "rgba(34,197,94,0.16)", text: "#22c55e", border: "#22c55e" },
  Rejected: { bg: "rgba(248,113,113,0.16)", text: "#f97373", border: "#ef4444" },
  Submitted: { bg: "rgba(59,130,246,0.18)", text: "#60a5fa", border: "#3b82f6" },
  Pending: { bg: "rgba(234,179,8,0.16)", text: "#eab308", border: "#eab308" },
};

function formatDate(d) {
  if (!d) return "";
  const date = new Date(d);
  return date.toLocaleString();
}

function MySubmissions() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // UI filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [langFilter, setLangFilter] = useState("all");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");
        const res = await api.get("/submissions/mine");
        setSubmissions(res.data || []);
      } catch (err) {
        console.error("Failed to load submissions:", err);
        const msg =
          err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to load submissions.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const languages = useMemo(() => {
    const set = new Set();
    submissions.forEach((s) => s.language && set.add(s.language));
    return Array.from(set);
  }, [submissions]);

  const filtered = useMemo(() => {
    return submissions.filter((s) => {
      const title = s.problem?.title || "Unknown Problem";
      if (search && !title.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (statusFilter !== "all" && (s.status || "Submitted") !== statusFilter) {
        return false;
      }
      if (langFilter !== "all" && s.language !== langFilter) {
        return false;
      }
      return true;
    });
  }, [submissions, search, statusFilter, langFilter]);

  if (!user) {
    return (
      <div
        className="app-page"
        style={{
          minHeight: "calc(100vh - 120px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#e5e7eb",
        }}
      >
        <div
          style={{
            background: "#020617",
            borderRadius: 18,
            padding: "32px 40px",
            boxShadow: "0 18px 60px rgba(0,0,0,0.7)",
            maxWidth: 480,
            textAlign: "center",
          }}
        >
          <h2 style={{ fontSize: 22, marginBottom: 10 }}>You’re not logged in</h2>
          <p style={{ fontSize: 14, color: "#9ca3af", marginBottom: 20 }}>
            Please log in to view your submissions history.
          </p>
          <button
            onClick={() => navigate("/login")}
            style={{
              background: "#6366f1",
              border: "none",
              color: "#f9fafb",
              fontWeight: 600,
              padding: "8px 20px",
              borderRadius: 999,
              cursor: "pointer",
            }}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="app-page"
      style={{
        minHeight: "calc(100vh - 120px)",
        color: "#e5e7eb",
      }}
    >
      {/* Header */}
      <div
        style={{
          marginBottom: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: "#f9fafb",
              marginBottom: 4,
            }}
          >
            My Submissions
          </h1>
          <p style={{ fontSize: 13, color: "#9ca3af" }}>
            Track your progress, see what passed, and revisit problems.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div
        style={{
          marginBottom: 18,
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "center",
        }}
      >
        <input
          type="text"
          placeholder="Search by problem title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            minWidth: 200,
            background: "#020617",
            borderRadius: 999,
            border: "1px solid #1f2937",
            padding: "7px 14px",
            color: "#e5e7eb",
            fontSize: 13,
            outline: "none",
          }}
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            background: "#020617",
            borderRadius: 999,
            border: "1px solid #1f2937",
            padding: "7px 14px",
            color: "#e5e7eb",
            fontSize: 13,
          }}
        >
          <option value="all">All statuses</option>
          <option value="Accepted">Accepted</option>
          <option value="Rejected">Rejected</option>
          <option value="Submitted">Submitted</option>
        </select>

        <select
          value={langFilter}
          onChange={(e) => setLangFilter(e.target.value)}
          style={{
            background: "#020617",
            borderRadius: 999,
            border: "1px solid #1f2937",
            padding: "7px 14px",
            color: "#e5e7eb",
            fontSize: 13,
          }}
        >
          <option value="all">All languages</option>
          {languages.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>
      </div>

      {/* Error / loading */}
      {loading && (
        <div style={{ color: "#9ca3af", fontSize: 14 }}>Loading submissions…</div>
      )}
      {error && !loading && (
        <div
          style={{
            marginBottom: 12,
            padding: "8px 12px",
            borderRadius: 10,
            background: "rgba(239,68,68,0.12)",
            border: "1px solid #ef4444",
            color: "#fecaca",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filtered.length === 0 && (
        <div
          style={{
            marginTop: 24,
            background: "#020617",
            borderRadius: 18,
            padding: "28px 24px",
            textAlign: "center",
            border: "1px dashed #1f2937",
          }}
        >
          <p style={{ fontSize: 15, marginBottom: 6 }}>No submissions yet.</p>
          <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 14 }}>
            Solve a problem and hit <span style={{ color: "#22c55e" }}>Submit</span> to
            see it appear here.
          </p>
          <button
            onClick={() => navigate("/problems")}
            style={{
              background: "#22c55e",
              border: "none",
              color: "#020617",
              fontWeight: 600,
              padding: "7px 18px",
              borderRadius: 999,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Go to Problems
          </button>
        </div>
      )}

      {/* Submissions list */}
      {!loading && filtered.length > 0 && (
        <div
          style={{
            marginTop: 6,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {filtered.map((sub) => {
            const title = sub.problem?.title || "Unknown Problem";
            const slug = sub.problem?.slug;
            const status = sub.status || "Submitted";
            const colors = statusColors[status] || statusColors.Submitted;

            return (
              <div
                key={sub._id}
                style={{
                  background: "linear-gradient(135deg, #020617, #020617)",
                  borderRadius: 16,
                  padding: "14px 18px",
                  border: "1px solid #111827",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 16,
                  boxShadow: "0 12px 40px rgba(0,0,0,0.65)",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 4,
                    }}
                  >
                    <button
                      onClick={() => slug && navigate(`/problems/${slug}`)}
                      style={{
                        background: "transparent",
                        border: "none",
                        padding: 0,
                        margin: 0,
                        cursor: slug ? "pointer" : "default",
                      }}
                    >
                      <h3
                        style={{
                          fontSize: 16,
                          fontWeight: 600,
                          color: "#e5e7eb",
                          textAlign: "left",
                        }}
                      >
                        {title}
                      </h3>
                    </button>

                    <span
                      style={{
                        padding: "2px 9px",
                        borderRadius: 999,
                        border: `1px solid ${colors.border}`,
                        background: colors.bg,
                        color: colors.text,
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      {status}
                    </span>
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      color: "#9ca3af",
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 10,
                    }}
                  >
                    <span>
                      Language:{" "}
                      <span style={{ color: "#e5e7eb" }}>
                        {sub.language || "N/A"}
                      </span>
                    </span>
                    <span>•</span>
                    <span>
                      Submitted:{" "}
                      <span style={{ color: "#e5e7eb" }}>
                        {formatDate(sub.createdAt)}
                      </span>
                    </span>
                    {sub.contest && (
                      <>
                        <span>•</span>
                        <span>
                          Contest:{" "}
                          <span style={{ color: "#e5e7eb" }}>
                            {sub.contest.name || "Contest"}
                          </span>
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: 6,
                    minWidth: 130,
                  }}
                >
                  {slug && (
                    <button
                      onClick={() => navigate(`/problems/${slug}`)}
                      style={{
                        borderRadius: 999,
                        border: "1px solid #4b5563",
                        background: "transparent",
                        color: "#e5e7eb",
                        fontSize: 12,
                        padding: "6px 12px",
                        cursor: "pointer",
                      }}
                    >
                      View Problem
                    </button>
                  )}
                  {sub.status === "Accepted" && (
                    <span style={{ fontSize: 11, color: "#22c55e" }}>
                      ✓ All example tests passed
                    </span>
                  )}
                  {sub.status === "Rejected" && (
                    <span style={{ fontSize: 11, color: "#f97373" }}>
                      ✗ One or more example tests failed
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MySubmissions;
