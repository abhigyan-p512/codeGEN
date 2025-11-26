// client/src/pages/Profile.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

const Profile = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: "",
    bio: "",
    location: "",
  });

  useEffect(() => {
    const hasToken = token || localStorage.getItem("token");
    if (!hasToken) {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const [meRes, statsRes] = await Promise.all([
          api.get("/users/me"),
          api.get("/users/me/stats"),
        ]);

        setProfile(meRes.data);
        setStats(statsRes.data);
      } catch (err) {
        console.error("Profile load error:", err);
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to load profile.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, navigate]);

  const openEdit = () => {
    if (!profile) return;
    setForm({
      name: profile.name || "",
      bio: profile.bio || "",
      location: profile.location || "",
    });
    setIsEditing(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");

      const res = await api.put("/users/me", form);
      setProfile(res.data);
      setIsEditing(false);
    } catch (err) {
      console.error("Save profile error:", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to update profile.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleViewSubmissions = () => {
    navigate("/submissions");
  };

  // ====== MONTHLY STREAK CALENDAR (CURRENT MONTH) ======
  const buildMonthlyCalendarData = () => {
    const activity = stats?.activityByDate || [];
    const activityMap = new Map(activity.map((d) => [d.date, d.count]));

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-based

    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);

    const dateToKey = (d) => d.toISOString().substring(0, 10);

    // figure out which days are part of the *current* streak
    const streakDatesSet = new Set();
    let cursor = new Date(now);

    while (cursor >= start) {
      const key = dateToKey(cursor);
      const count = activityMap.get(key) || 0;
      if (count > 0) {
        streakDatesSet.add(key);
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }

    const weeks = [];
    let week = [];

    const startOffset = (start.getDay() + 7) % 7; // Sunday=0..Saturday=6
    for (let i = 0; i < startOffset; i++) {
      week.push(null);
    }

    let monthSubmissions = 0;
    let monthActiveDays = 0;

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = dateToKey(d);
      const count = activityMap.get(key) || 0;
      const inCurrentStreak = streakDatesSet.has(key);

      if (count > 0) {
        monthSubmissions += count;
        monthActiveDays += 1;
      }

      week.push({
        date: key,
        dayNumber: d.getDate(),
        count,
        inCurrentStreak,
      });

      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
    }

    if (week.length > 0) {
      while (week.length < 7) week.push(null);
      weeks.push(week);
    }

    const monthName = start.toLocaleString("en-US", { month: "long" });
    const monthYearLabel = `${monthName} ${year}`;

    return {
      weeks,
      monthSubmissions,
      monthActiveDays,
      monthYearLabel,
    };
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          padding: "32px 48px",
          background: "#020617",
          color: "#e5e7eb",
        }}
      >
        <div
          style={{
            maxWidth: 960,
            margin: "0 auto",
            background: "#020617",
            borderRadius: 18,
            padding: 24,
            border: "1px solid #111827",
            boxShadow: "0 20px 60px rgba(0,0,0,0.85)",
          }}
        >
          <p style={{ color: "#9ca3af", fontSize: 14 }}>Loading profile…</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div
        style={{
          minHeight: "100vh",
          padding: "32px 48px",
          background: "#020617",
          color: "#e5e7eb",
        }}
      >
        <div
          style={{
            maxWidth: 960,
            margin: "0 auto",
            background: "#020617",
            borderRadius: 18,
            padding: 24,
            border: "1px solid #111827",
            boxShadow: "0 20px 60px rgba(0,0,0,0.85)",
          }}
        >
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
            Profile
          </h1>
          <p style={{ color: "#f97373", fontSize: 14 }}>
            {error || "Profile not found."}
          </p>
        </div>
      </div>
    );
  }

  // ---------- Data mapping ----------
  const memberSince = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString()
    : "—";

  const totalSolved = profile.totalSolved || 0;
  const totalSubmissions = profile.totalSubmissions || 0;
  const duelWins = profile.duelWins || 0;
  const duelLosses = profile.duelLosses || 0;

  const difficultyStats = stats?.difficultyStats || {
    Easy: profile.solvedEasy || 0,
    Medium: profile.solvedMedium || 0,
    Hard: profile.solvedHard || 0,
  };

  const acceptanceRate =
    totalSubmissions > 0
      ? Math.round((totalSolved / totalSubmissions) * 100)
      : 0;

  const currentStreak = stats?.streakCurrent ?? profile.streakCurrent ?? 0;
  const longestStreak = stats?.streakLongest ?? profile.streakLongest ?? 0;

  // ====== RATING LOGIC ======
  const computeRating = () => {
    const base = 1500;

    const solvedWeight = 8; // points per solved problem
    const duelWinPoints = 25;
    const duelLossPoints = -15;
    const streakWeight = 4; // per current streak day
    const acceptanceWeight = 1.5; // per % acceptance

    const solvedScore = totalSolved * solvedWeight;
    const duelScore =
      duelWins * duelWinPoints + duelLosses * duelLossPoints;
    const streakScore = currentStreak * streakWeight;
    const accuracyScore = Math.round(acceptanceRate * acceptanceWeight);

    let rating = base + solvedScore + duelScore + streakScore + accuracyScore;

    rating = Math.max(800, Math.min(3000, rating));

    return rating;
  };

  const rating = computeRating();
  const displayName = profile.name || profile.username;

  const {
    weeks,
    monthSubmissions,
    monthActiveDays,
    monthYearLabel,
  } = buildMonthlyCalendarData();

  // ---------- UI ----------
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "32px 48px",
        background: "#020617",
        color: "#e5e7eb",
      }}
    >
      <div
        style={{
          maxWidth: 1040,
          margin: "0 auto",
          background:
            "radial-gradient(circle at top, rgba(56,189,248,0.12), transparent 65%), #020617",
          borderRadius: 28,
          padding: 24,
          border: "1px solid #111827",
          boxShadow: "0 30px 80px rgba(0,0,0,0.95)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: "999px",
              background:
                "linear-gradient(135deg, #22c55e, #0ea5e9, #6366f1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 24,
              color: "#020617",
              boxShadow: "0 14px 32px rgba(0,0,0,0.7)",
            }}
          >
            {profile.username?.slice(0, 2).toUpperCase()}
          </div>

          <div style={{ flex: 1 }}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 8,
                marginBottom: 6,
              }}
            >
              <h1
                style={{
                  fontSize: 26,
                  fontWeight: 700,
                  letterSpacing: 0.25,
                }}
              >
                {displayName}
              </h1>
              <span
                style={{
                  fontSize: 12,
                  padding: "2px 10px",
                  borderRadius: 999,
                  border: "1px solid rgba(148,163,184,0.6)",
                  color: "#9ca3af",
                }}
              >
                @{profile.username}
              </span>
            </div>
            <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 2 }}>
              Member since{" "}
              <span style={{ color: "#e5e7eb" }}>{memberSince}</span>
            </p>
            <p
              style={{
                fontSize: 13,
                color: profile.bio ? "#e5e7eb" : "#6b7280",
              }}
            >
              {profile.bio || "Add a short bio to tell others about you."}
            </p>
            {profile.location && (
              <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
                📍 {profile.location}
              </p>
            )}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 8,
            }}
          >
            <div
              style={{
                padding: "10px 16px",
                borderRadius: 18,
                border: "1px solid rgba(96,165,250,0.7)",
                background:
                  "radial-gradient(circle at top, rgba(37,99,235,0.35), transparent 60%), #020617",
                minWidth: 140,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "#9ca3af",
                  textTransform: "uppercase",
                  letterSpacing: 0.1,
                }}
              >
                Rating
              </div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: "#60a5fa",
                }}
              >
                {rating}
              </div>
            </div>

            <button
              type="button"
              onClick={openEdit}
              style={{
                padding: "6px 14px",
                fontSize: 13,
                borderRadius: 999,
                border: "1px solid #4b5563",
                background:
                  "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(30,64,175,0.7))",
                color: "#e5e7eb",
                cursor: "pointer",
              }}
            >
              Edit profile
            </button>
          </div>
        </div>

        {/* Edit form */}
        {isEditing && (
          <form
            onSubmit={handleSaveProfile}
            style={{
              marginBottom: 20,
              padding: 16,
              borderRadius: 18,
              background: "rgba(15,23,42,0.96)",
              border: "1px solid #111827",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 12,
                marginBottom: 12,
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: 12,
                    color: "#9ca3af",
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  style={{
                    width: "100%",
                    padding: "6px 10px",
                    borderRadius: 8,
                    border: "1px solid #374151",
                    background: "#020617",
                    color: "#e5e7eb",
                    fontSize: 13,
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: 12,
                    color: "#9ca3af",
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={form.location}
                  onChange={handleFormChange}
                  style={{
                    width: "100%",
                    padding: "6px 10px",
                    borderRadius: 8,
                    border: "1px solid #374151",
                    background: "#020617",
                    color: "#e5e7eb",
                    fontSize: 13,
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label
                style={{
                  fontSize: 12,
                  color: "#9ca3af",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Bio
              </label>
              <textarea
                name="bio"
                value={form.bio}
                onChange={handleFormChange}
                rows={3}
                style={{
                  width: "100%",
                  padding: "6px 10px",
                  borderRadius: 8,
                  border: "1px solid #374151",
                  background: "#020617",
                  color: "#e5e7eb",
                  fontSize: 13,
                  resize: "vertical",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                style={{
                  padding: "6px 12px",
                  fontSize: 13,
                  borderRadius: 999,
                  border: "1px solid #4b5563",
                  background: "#020617",
                  color: "#e5e7eb",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: "6px 14px",
                  fontSize: 13,
                  borderRadius: 999,
                  border: "1px solid #22c55e",
                  background: saving ? "#064e3b" : "#16a34a",
                  color: "#ecfdf5",
                  cursor: saving ? "default" : "pointer",
                }}
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        )}

        {/* Overview grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 16,
            marginBottom: 26,
          }}
        >
          {/* Problems solved */}
          <div
            style={{
              padding: 16,
              borderRadius: 18,
              background: "linear-gradient(145deg,#020617,#020617)",
              border: "1px solid #0f172a",
            }}
          >
            <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 6 }}>
              Problems solved
            </div>
            <div style={{ fontSize: 20, fontWeight: 600 }}>{totalSolved}</div>
          </div>

          {/* Submissions + View button */}
          <div
            style={{
              padding: 16,
              borderRadius: 18,
              background: "linear-gradient(145deg,#020617,#020617)",
              border: "1px solid #0f172a",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <div style={{ fontSize: 12, color: "#9ca3af" }}>Submissions</div>
            <div style={{ fontSize: 20, fontWeight: 600 }}>
              {totalSubmissions}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "#9ca3af",
              }}
            >
              Acceptance rate: {acceptanceRate}%
            </div>
            <button
              type="button"
              onClick={handleViewSubmissions}
              style={{
                marginTop: 6,
                alignSelf: "flex-start",
                padding: "4px 12px",
                fontSize: 12,
                borderRadius: 999,
                border: "1px solid #4b5563",
                background: "#020617",
                color: "#e5e7eb",
                cursor: "pointer",
              }}
            >
              View submissions
            </button>
          </div>

          {/* Duel record */}
          <div
            style={{
              padding: 16,
              borderRadius: 18,
              background: "linear-gradient(145deg,#020617,#020617)",
              border: "1px solid #0f172a",
            }}
          >
            <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 6 }}>
              Duel record
            </div>
            <div style={{ fontSize: 20, fontWeight: 600 }}>
              {duelWins}W / {duelLosses}L
            </div>
          </div>

          {/* Streak */}
          <div
            style={{
              padding: 16,
              borderRadius: 18,
              background: "linear-gradient(145deg,#020617,#020617)",
              border: "1px solid #0f172a",
            }}
          >
            <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 6 }}>
              Streak
            </div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>
              Current: {currentStreak} day
              {currentStreak === 1 ? "" : "s"}
            </div>
            <div
              style={{
                marginTop: 2,
                fontSize: 12,
                color: "#9ca3af",
              }}
            >
              Longest: {longestStreak} day
              {longestStreak === 1 ? "" : "s"}
            </div>
          </div>
        </div>

        {/* Difficulty breakdown */}
        <h3
          style={{
            fontSize: 14,
            color: "#9ca3af",
            marginBottom: 12,
            textTransform: "uppercase",
            letterSpacing: 0.12,
          }}
        >
          Difficulty breakdown
        </h3>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: 999,
              border: "1px solid rgba(34,197,94,0.7)",
              background: "rgba(22,163,74,0.2)",
              textAlign: "center",
              minWidth: 120,
              fontSize: 13,
            }}
          >
            Easy — {difficultyStats.Easy || 0}
          </div>
          <div
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: 999,
              border: "1px solid rgba(249,115,22,0.7)",
              background: "rgba(234,88,12,0.22)",
              textAlign: "center",
              minWidth: 120,
              fontSize: 13,
            }}
          >
            Medium — {difficultyStats.Medium || 0}
          </div>
          <div
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: 999,
              border: "1px solid rgba(239,68,68,0.7)",
              background: "rgba(248,113,113,0.22)",
              textAlign: "center",
              minWidth: 120,
              fontSize: 13,
            }}
          >
            Hard — {difficultyStats.Hard || 0}
          </div>
        </div>

        {/* Monthly streak calendar */}
        <div
          style={{
            marginTop: 28,
            paddingTop: 16,
            borderTop: "1px solid rgba(31,41,55,0.9)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 8,
            }}
          >
            <div style={{ fontSize: 14 }}>
              <span style={{ fontWeight: 600 }}>
                {monthSubmissions} submissions
              </span>{" "}
              <span style={{ color: "#9ca3af" }}>this month</span>
            </div>
            <div
              style={{
                fontSize: 12,
                color: "#9ca3af",
                display: "flex",
                gap: 16,
                alignItems: "center",
              }}
            >
              <span>Active days: {monthActiveDays}</span>
              <span>Max streak: {longestStreak}</span>
              <span
                style={{
                  padding: "2px 8px",
                  borderRadius: 999,
                  border: "1px solid rgba(248,181,0,0.7)",
                  background:
                    "radial-gradient(circle at top, rgba(248,181,0,0.28), transparent 60%)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <span style={{ fontSize: 12 }}>🔥</span>
                <span style={{ fontSize: 11 }}>
                  {currentStreak}-day streak
                </span>
              </span>
            </div>
          </div>

          <div
            style={{
              padding: 16,
              borderRadius: 22,
              background: "rgba(9,15,32,0.98)",
              border: "1px solid #111827",
              boxShadow: "0 20px 50px rgba(0,0,0,0.7)",
            }}
          >
            {/* Month header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  letterSpacing: 0.2,
                }}
              >
                {monthYearLabel}
              </div>
            </div>

            {/* Weekday labels */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                gap: 6,
                fontSize: 11,
                color: "#6b7280",
                marginBottom: 8,
                textTransform: "uppercase",
              }}
            >
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                <div
                  key={d}
                  style={{
                    textAlign: "center",
                    letterSpacing: 0.06,
                  }}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                gap: 6,
                fontSize: 12,
              }}
            >
              {weeks.map((week, wi) =>
                week.map((cell, ci) => {
                  if (!cell) {
                    return (
                      <div
                        key={`${wi}-${ci}`}
                        style={{
                          height: 32,
                          borderRadius: 10,
                          border: "1px solid transparent",
                        }}
                      />
                    );
                  }

                  const isActive = cell.count > 0;
                  const inCurrentStreak = cell.inCurrentStreak;

                  let background = "#020617";
                  let border = "1px solid #0f172a";
                  let textColor = "#9ca3af";
                  let boxShadow = "none";

                  if (isActive) {
                    background = "rgba(37,99,235,0.28)";
                    border = "1px solid rgba(59,130,246,0.9)";
                    textColor = "#e5e7eb";
                  }

                  if (inCurrentStreak) {
                    background =
                      "linear-gradient(135deg, rgba(248,181,0,0.9), rgba(245,158,11,0.75))";
                    border = "1px solid rgba(251,191,36,1)";
                    textColor = "#111827";
                    boxShadow = "0 0 0 1px rgba(250,204,21,0.4)";
                  }

                  return (
                    <div
                      key={`${wi}-${ci}`}
                      title={
                        isActive
                          ? `${cell.count} submission${
                              cell.count === 1 ? "" : "s"
                            } on ${cell.date}`
                          : cell.date
                      }
                      style={{
                        height: 32,
                        borderRadius: 10,
                        background,
                        border,
                        boxShadow,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: isActive ? 600 : 400,
                      }}
                    >
                      <span style={{ color: textColor }}>
                        {cell.dayNumber}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Legend */}
            <div
              style={{
                marginTop: 12,
                fontSize: 11,
                color: "#9ca3af",
                display: "flex",
                gap: 14,
                justifyContent: "flex-end",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 4,
                    border: "1px solid #1f2937",
                    background: "#020617",
                  }}
                />
                <span>Inactive</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 4,
                    border: "1px solid rgba(59,130,246,0.9)",
                    background: "rgba(37,99,235,0.45)",
                  }}
                />
                <span>Active day</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 4,
                    border: "1px solid rgba(251,191,36,1)",
                    background:
                      "linear-gradient(135deg, rgba(248,181,0,0.9), rgba(245,158,11,0.75))",
                  }}
                />
                <span>Current streak</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
