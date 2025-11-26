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

  // month used for the calendar (first day of month)
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // ====== Fetch profile + stats ======
  useEffect(() => {
    const hasToken = token || sessionStorage.getItem("token");
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

  // ====== Edit profile handlers ======
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

  // ====== Heatmap helpers ======
  const getCellColor = (count) => {
    if (!count || count <= 0) return "rgba(15,23,42,0.95)";
    if (count === 1) return "rgba(56,189,248,0.35)";
    if (count <= 3) return "rgba(56,189,248,0.6)";
    if (count <= 6) return "rgba(56,189,248,0.85)";
    return "rgba(56,189,248,1)";
  };

  const getCellBorder = (count) => {
    if (!count || count <= 0) return "1px solid #020617";
    return "1px solid #0ea5e9";
  };

  // ====== Build calendar data + streak types ======
  const buildMonthlyHeatmapData = (monthDate) => {
    const activity = stats?.activityByDate || [];
    const activityMap = new Map(activity.map((d) => [d.date, d.count]));

    // all active days (count > 0), sorted
    const activeDates = activity
      .filter((d) => d.count > 0)
      .map((d) => new Date(d.date))
      .sort((a, b) => a - b);

    // compute current streak from last active day backwards
    const streakSet = new Set();
    if (activeDates.length > 0) {
      let idx = activeDates.length - 1;
      let current = activeDates[idx];
      const toKey = (d) => d.toISOString().substring(0, 10);

      streakSet.add(toKey(current));
      while (idx > 0) {
        const prev = activeDates[idx - 1];
        const diffDays = Math.round((current - prev) / 86400000);
        if (diffDays === 1) {
          streakSet.add(toKey(prev));
          current = prev;
          idx--;
        } else break;
      }
    }

    const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const end = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

    const weeks = [];
    let week = [];

    const startDay = start.getDay();
    for (let i = 0; i < startDay; i++) week.push(null);

    const dateToKey = (d) => d.toISOString().substring(0, 10);

    let monthSubmissions = 0;
    let monthActiveDays = 0;

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const cur = new Date(d);
      const key = dateToKey(cur);
      const count = activityMap.get(key) || 0;
      const isInStreak = streakSet.has(key);

      if (count > 0) {
        monthSubmissions += count;
        monthActiveDays += 1;
      }

      let streakType = null;
      if (isInStreak) {
        const prev = new Date(cur);
        prev.setDate(cur.getDate() - 1);
        const next = new Date(cur);
        next.setDate(cur.getDate() + 1);

        const prevIn = streakSet.has(dateToKey(prev));
        const nextIn = streakSet.has(dateToKey(next));

        if (prevIn && nextIn) streakType = "middle";
        else if (!prevIn && nextIn) streakType = "start";
        else if (prevIn && !nextIn) streakType = "end";
        else streakType = "single";
      }

      week.push({ date: key, count, isInStreak, streakType });

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
    const yearLabel = start.getFullYear();
    const monthYearLabel = `${monthName} ${yearLabel}`;

    return { weeks, monthSubmissions, monthActiveDays, monthYearLabel };
  };

  const handlePrevMonth = () => {
    setCalendarMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      d.setDate(1);
      return d;
    });
  };

  const handleNextMonth = () => {
    setCalendarMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      d.setDate(1);
      return d;
    });
  };

  // ====== Loading / error ======
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

  // ====== Data mapping ======
  const memberSince = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString()
    : "—";

  const totalSolved = profile.totalSolved || 0;
  const totalSubmissions = profile.totalSubmissions || 0;

  const duelWins = stats?.duelWins ?? profile.duelWins ?? 0;
  const duelLosses = stats?.duelLosses ?? profile.duelLosses ?? 0;

  const teamBattlesPlayed = profile.teamBattlesPlayed || 0;
  const teamBattlesWon = profile.teamBattlesWon || 0;
  const teamBattlesLost = profile.teamBattlesLost || 0;

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

  const rating = profile.rating || stats?.rating || 1500;
  const displayName = profile.name || profile.username;

  const {
    weeks,
    monthSubmissions,
    monthActiveDays,
    monthYearLabel,
  } = buildMonthlyHeatmapData(calendarMonth);

  // streak glow animation + subtle fade-in
  const streakAnimationStyles = `
    @keyframes streakGlow {
      from {
        box-shadow: 0 0 0 rgba(248, 181, 0, 0.0);
        transform: translateY(0);
      }
      to {
        box-shadow: 0 0 18px rgba(248, 181, 0, 0.8);
        transform: translateY(-1px);
      }
    }

    @keyframes dayFadeIn {
      from {
        opacity: 0;
        transform: translateY(3px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;

  // ====== UI ======
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "32px 48px",
        background: "#020617",
        color: "#e5e7eb",
      }}
    >
      <style>{streakAnimationStyles}</style>

      <div
        style={{
          maxWidth: 1040,
          margin: "0 auto",
          background:
            "radial-gradient(circle at top, rgba(56,189,248,0.12), transparent 60%), #020617",
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
              boxShadow: "0 16px 40px rgba(0,0,0,0.85)",
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
                minWidth: 170,
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
              <div
                style={{
                  marginTop: 4,
                  fontSize: 11,
                  color: "#9ca3af",
                }}
              >
                Current streak:{" "}
                <span style={{ color: "#facc15" }}>{currentStreak}🔥</span>
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
                  "linear-gradient(135deg, rgba(99,102,241,0.4), rgba(30,64,175,0.9))",
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

          {/* Submissions */}
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

          {/* Duels */}
          <div
            style={{
              padding: 16,
              borderRadius: 18,
              background: "linear-gradient(145deg,#020617,#020617)",
              border: "1px solid #0f172a",
            }}
          >
            <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 6 }}>
              1v1 Duels
            </div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>
              {duelWins}W / {duelLosses}L
            </div>
          </div>

          {/* Team battles */}
          <div
            style={{
              padding: 16,
              borderRadius: 18,
              background: "linear-gradient(145deg,#020617,#020617)",
              border: "1px solid #0f172a",
            }}
          >
            <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 6 }}>
              Team battles
            </div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>
              Played: {teamBattlesPlayed}
            </div>
            <div
              style={{
                marginTop: 4,
                fontSize: 12,
                color: "#9ca3af",
              }}
            >
              Wins: {teamBattlesWon} · Losses: {teamBattlesLost}
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

        {/* ===== Streak Calendar (joined ribbon, more aesthetic) ===== */}
        <div style={{ marginTop: 32 }}>
          {/* Calendar heading row */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 2,
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 600 }}>
                  Streak calendar
                </span>
                <span style={{ fontSize: 16 }}>🔥</span>
              </div>
              <div style={{ fontSize: 12, color: "#9ca3af" }}>
                <span style={{ fontWeight: 600 }}>{monthSubmissions}</span>{" "}
                submissions ·{" "}
                <span style={{ fontWeight: 600 }}>{monthActiveDays}</span> active
                days · Max streak{" "}
                <span style={{ color: "#facc15" }}>{longestStreak}</span>
              </div>
            </div>

            {/* Month switcher */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13,
                color: "#cbd5e1",
              }}
            >
              <button
                type="button"
                onClick={handlePrevMonth}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 999,
                  border: "1px solid #1f2937",
                  background:
                    "radial-gradient(circle at top, rgba(15,23,42,1), rgba(15,23,42,1))",
                  color: "#e5e7eb",
                  cursor: "pointer",
                }}
              >
                ‹
              </button>
              <span
                style={{
                  minWidth: 130,
                  textAlign: "center",
                  fontWeight: 500,
                }}
              >
                {monthYearLabel}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 999,
                  border: "1px solid #1f2937",
                  background:
                    "radial-gradient(circle at top, rgba(15,23,42,1), rgba(15,23,42,1))",
                  color: "#e5e7eb",
                  cursor: "pointer",
                }}
              >
                ›
              </button>
            </div>
          </div>

          {/* Calendar card */}
          <div
            style={{
              padding: 18,
              borderRadius: 22,
              background:
                "radial-gradient(circle at top, rgba(15,23,42,1), rgba(15,23,42,0.96))",
              border: "1px solid #111827",
              boxShadow: "0 16px 30px rgba(0,0,0,0.55)",
            }}
          >
            {/* Weekday labels */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                fontSize: 11,
                textAlign: "center",
                marginBottom: 8,
                color: "#64748b",
              }}
            >
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>

            <div
              style={{
                height: 1,
                width: "100%",
                background:
                  "linear-gradient(to right, transparent, #1f2937, transparent)",
                marginBottom: 8,
              }}
            />

            {/* Calendar grid with continuous streak ribbon */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                columnGap: 0,
                rowGap: 10,
              }}
            >
              {weeks.flat().map((cell, i) => {
                const todayKey = new Date().toISOString().substring(0, 10);
                const isToday = cell && cell.date === todayKey;

                const outerStyle = {
                  width: "100%",
                  height: 38,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  animation: "dayFadeIn 0.25s ease-out",
                };

                let badgeStyle = {
                  minWidth: 26,
                  height: 26,
                  padding: "0 10px",
                  borderRadius: 999,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 500,
                  transition:
                    "transform 0.15s ease-out, box-shadow 0.15s ease-out",
                };

                let showBadge = !!cell;

                if (!cell) {
                  showBadge = false;
                } else if (cell.streakType) {
                  // current streak -> orange ribbon
                  badgeStyle.background =
                    "linear-gradient(135deg, #f59e0b, #fbbf24)";
                  badgeStyle.color = "#111827";
                  badgeStyle.boxShadow =
                    "0 5px 14px rgba(245,158,11,0.68)";
                  badgeStyle.animation =
                    "streakGlow 1.2s ease-in-out infinite alternate";

                  // make ribbon continuous: full cell width
                  badgeStyle.width = "100%";
                  badgeStyle.minWidth = "unset";
                  badgeStyle.padding = "0 10px";

                  if (cell.streakType === "start") {
                    badgeStyle.borderRadius = "999px 0 0 999px";
                  } else if (cell.streakType === "end") {
                    badgeStyle.borderRadius = "0 999px 999px 0";
                  } else if (cell.streakType === "middle") {
                    badgeStyle.borderRadius = "0";
                  } else {
                    // single-day streak
                    badgeStyle.borderRadius = "999px";
                  }

                  if (isToday) {
                    badgeStyle.boxShadow =
                      "0 0 18px rgba(251,191,36,0.95)";
                  }
                } else if (cell.count > 0) {
                  // active but not in current streak
                  badgeStyle.background =
                    "radial-gradient(circle, rgba(245,158,11,0.26), transparent 70%)";
                  badgeStyle.border = "1px solid rgba(245,158,11,0.65)";
                  badgeStyle.color = "#e5e7eb";
                } else {
                  // inactive
                  badgeStyle.background = "transparent";
                  badgeStyle.color = "#4b5563";
                }

                if (isToday && !cell?.streakType) {
                  badgeStyle.border = "1px solid #38bdf8";
                  badgeStyle.boxShadow =
                    "0 0 12px rgba(56,189,248,0.65)";
                }

                return (
                  <div key={i} style={outerStyle}>
                    {showBadge && (
                      <div
                        title={
                          cell && cell.count > 0
                            ? `${cell.count} submission${
                                cell.count === 1 ? "" : "s"
                              } on ${cell.date}`
                            : ""
                        }
                        style={badgeStyle}
                      >
                        {cell ? new Date(cell.date).getDate() : ""}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Heat legend */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: 6,
                fontSize: 11,
                marginTop: 12,
                color: "#94a3b8",
              }}
            >
              <span>Less</span>
              {[0, 1, 3, 6, 10].map((c, idx) => (
                <div
                  key={idx}
                  style={{
                    width: 16,
                    height: 10,
                    borderRadius: 999,
                    background: getCellColor(c),
                    border: getCellBorder(c),
                  }}
                />
              ))}
              <span>More</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
