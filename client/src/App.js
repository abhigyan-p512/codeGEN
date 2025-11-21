// src/App.js
import React from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";

import Home from "./pages/Home";
import ProblemPage from "./pages/ProblemPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MySubmissions from "./pages/MySubmissions";
import Profile from "./pages/Profile";
import LandingPage from "./LandingPage";
import SimpleCodeEditor from "./components/SimpleCodeEditor";

import ContestsList from "./pages/ContestsList";
import ContestPage from "./pages/ContestPage";
import CreateContestPage from "./pages/CreateContestPage";

import DuelPage from "./pages/DuelPage";
import DuelRoomPage from "./pages/DuelRoomPage";
import TeamBattlePage from "./pages/TeamBattlePage";

import { useAuth } from "./context/AuthContext";
import LeaderboardPage from "./pages/LeaderboardPage";

function App() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isLanding = location.pathname === "/";
  const isSimpleEditor = location.pathname === "/simple-editor";

  // helper to highlight active nav link
  const navLinkClass = (path) => {
    const current = location.pathname;
    const isActive =
      current === path ||
      (path !== "/" && current.startsWith(path));
    return "nav-link" + (isActive ? " active" : "");
  };

  return (
    <div
      style={{
        padding: isLanding ? 0 : "20px",
        fontFamily: "sans-serif",
      }}
    >
      {/* Top navbar (hidden on landing) */}
      {!isLanding && (
        <nav className="navbar-main">
          <div className="navbar-left">
            <Link to="/" className="navbar-logo">
              CodeGen4Future
            </Link>
          </div>

          <div className="navbar-right">
            {/* Hide some nav items on simple editor */}
            {!isSimpleEditor && (
              <>
                <Link to="/problems" className={navLinkClass("/problems")}>
                  Problems
                </Link>
                <Link to="/contests" className={navLinkClass("/contests")}>
                  Contests
                </Link>
                <Link to="/duel" className={navLinkClass("/duel")}>
                  1v1 Duel
                </Link>
                <Link to="/teams" className={navLinkClass("/teams")}>
                  Team Battle
                </Link>
                <Link
                  to="/simple-editor"
                  className={navLinkClass("/simple-editor")}
                >
                  Simple Editor
                </Link>
              </>
            )}

            {user ? (
              <>
                <Link
                  to="/submissions"
                  className={navLinkClass("/submissions")}
                >
                  My Submissions
                </Link>
                <Link to="/profile" className={navLinkClass("/profile")}>
                  Profile
                </Link>
                <span className="user-text">
                  Hi, {user.username || user.email}
                </span>
                <button className="btn-logout" onClick={logout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className={navLinkClass("/login")}>
                  Login
                </Link>
                <Link to="/register" className={navLinkClass("/register")}>
                  Register
                </Link>
              </>
            )}
          </div>
        </nav>
      )}

      <Routes>
        {/* Landing page */}
        <Route path="/" element={<LandingPage />} />

        {/* Problems list & details */}
        <Route path="/problems" element={<Home />} />
        <Route path="/problems/:slug" element={<ProblemPage />} />
        {/* Problem opened from contest */}
        <Route
          path="/contests/:contestId/problems/:slug"
          element={<ProblemPage />}
        />

        {/* Simple standalone editor */}
        <Route path="/simple-editor" element={<SimpleCodeEditor />} />

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* User pages */}
        <Route path="/submissions" element={<MySubmissions />} />
        <Route path="/profile" element={<Profile />} />

        {/* Contests */}
        <Route path="/contests" element={<ContestsList />} />
        <Route path="/contests/new" element={<CreateContestPage />} />
        <Route path="/contests/:id" element={<ContestPage />} />

        {/* 1v1 Duel */}
        <Route path="/duel" element={<DuelPage />} />
        <Route path="/duel-room/:roomId" element={<DuelRoomPage />} />

        {/* Team Battle */}
        <Route path="/teams" element={<TeamBattlePage />} />
        
        <Route path="/leaderboard" element={<LeaderboardPage />} />   
      </Routes>
    </div>
  );
}

export default App;
