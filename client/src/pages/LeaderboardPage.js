// src/pages/LeaderboardPage.js
import React, { useEffect, useState } from "react";
import axios from "../utils/api";

export default function LeaderboardPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    axios
      .get("/stats/leaderboard")
      .then((res) => {
        if (mounted) setUsers(res.data || []);
      })
      .catch((err) => {
        console.error("Failed to load leaderboard", err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const formatAccuracy = (u) => {
    const totalSub = u.totalSubmissions || 0;
    const accepted = u.acceptedSubmissions ?? u.totalSolved ?? 0;
    if (!totalSub) return "–";
    const pct = (accepted / totalSub) * 100;
    return `${pct.toFixed(1)}%`;
  };

  const renderRank = (index) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return index + 1;
  };

  return (
    <div className="page-container">
      <div className="page-card">
        <div className="page-header">
          <div>
            <h1 className="page-heading">🏆 Global Leaderboard</h1>
            <p className="page-subtitle">
              See who&apos;s crushing problems, duels, team battles, and contests on
              CodeGen4Future.
            </p>
          </div>
        </div>

        {loading ? (
          <p className="page-muted">Loading leaderboard...</p>
        ) : users.length === 0 ? (
          <p className="page-muted">No data yet. Solve some problems!</p>
        ) : (
          <div className="table-wrapper">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>User</th>
                  <th>Rating</th>
                  <th>Solved</th>
                  <th>Accepted</th>
                  <th>Accuracy</th>
                  <th>Duels</th>
                  <th>Team Battles</th>
                  <th>Contests</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => {
                  const totalSolved = u.totalSolved || 0;
                  const easy = u.solvedEasy || 0;
                  const med = u.solvedMedium || 0;
                  const hard = u.solvedHard || 0;
                  const wins = u.duelWins || 0;
                  const losses = u.duelLosses || 0;
                  const contestsPlayed = u.contestsPlayed || 0;
                  const contestsWon = u.contestsWon || 0;
                  const accepted = u.acceptedSubmissions || 0;

                  const teamPlayed = u.teamBattlesPlayed || 0;
                  const teamWon = u.teamBattlesWon || 0;
                  const teamLost = u.teamBattlesLost || 0;

                  return (
                    <tr
                      key={u._id || u.username}
                      className={
                        i === 0
                          ? "leaderboard-row top-1"
                          : i === 1
                          ? "leaderboard-row top-2"
                          : i === 2
                          ? "leaderboard-row top-3"
                          : "leaderboard-row"
                      }
                    >
                      <td>{renderRank(i)}</td>
                      <td>
                        <div className="user-cell">
                          <div className="avatar-circle">
                            {u.username?.[0]?.toUpperCase() || "U"}
                          </div>
                          <span className="user-name">{u.username}</span>
                        </div>
                      </td>
                      <td>
                        <span className="chip chip-primary">
                          {u.rating ?? 1500}
                        </span>
                      </td>
                      <td>
                        <div className="solved-breakdown">
                          <span className="chip chip-easy">E {easy}</span>
                          <span className="chip chip-medium">M {med}</span>
                          <span className="chip chip-hard">H {hard}</span>
                          <span className="chip chip-neutral">
                            Total {totalSolved}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="chip chip-secondary">
                          {accepted}
                        </span>
                      </td>
                      <td>{formatAccuracy(u)}</td>
                      <td>
                        <span className="chip chip-secondary">
                          {wins}W / {losses}L
                        </span>
                      </td>
                      <td>
                        <span className="chip chip-secondary">
                          {teamWon}W / {teamLost}L{" "}
                          <span className="chip-small">
                            ({teamPlayed} played)
                          </span>
                        </span>
                      </td>
                      <td>
                        <span className="chip chip-neutral">
                          {contestsWon}/{contestsPlayed} won
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
