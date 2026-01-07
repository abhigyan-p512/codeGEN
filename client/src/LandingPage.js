// src/LandingPage.js
import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import "./styles.css";

const LandingPage = () => {
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleSmoothScroll = (e) => {
      if (e.target.getAttribute("href")?.startsWith("#")) {
        e.preventDefault();
        const target = document.querySelector(e.target.getAttribute("href"));
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    };

    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", handleSmoothScroll);
    });

    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -100px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("visible");
      });
    }, observerOptions);

    document.querySelectorAll(".fade-in").forEach((el) => observer.observe(el));

    const handleScroll = () => {
      const navbar = document.querySelector(".navbar");
      navbar.style.background =
        window.scrollY > 100 ? "rgba(10,10,10,0.75)" : "rgba(10,10,10,0.4)";
      navbar.style.backdropFilter =
        window.scrollY > 100 ? "blur(12px)" : "blur(5px)";
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <style>
        {`
        .hero-title {
          font-size: clamp(3.5rem, 7vw, 6rem);
          font-weight: 800;
          text-align: center;
          line-height: 1.05;
          margin-bottom: 18px;
          background: linear-gradient(45deg, #00f2ff, #00ff99, #9d4dff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-line {
          display: block;
        }
      `}
      </style>

      <div className="bg-pattern"></div>

      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="logo">CodeGen4Future</div>

          <ul className="nav-menu">
            <li><Link to="/about" className="nav-btn">About</Link></li>
            <li><Link to="/problems" className="nav-btn">Problems</Link></li>
            <li><Link to="/contests" className="nav-btn">Contests</Link></li>
            <li><Link to="/leaderboard" className="nav-btn">Leaderboard</Link></li>

            {user ? (
              <>
                <li><Link to="/profile" className="nav-btn">Profile</Link></li>
                <li><span className="nav-user-text">Hi, {user.username || user.email}</span></li>
                <li><button className="btn-logout" onClick={logout}>Logout</button></li>
              </>
            ) : (
              <>
                <li><Link to="/login" className="nav-btn">Login</Link></li>
                <li><Link to="/register" className="nav-btn">Register</Link></li>
              </>
            )}
          </ul>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content fade-in">
          <h1 className="hero-title">
            <span className="hero-line">Code,</span>
            <span className="hero-line">Compete,</span>
            <span className="hero-line">Conquer</span>
          </h1>

          <p style={{ fontSize: "20px", color: "#d0d0d0", marginTop: "10px" }}>
            The future of coding is in your browser.
          </p>

          <div
            className="cta-buttons"
            style={{
              marginTop: "25px",
              display: "flex",
              gap: "14px",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <Link to="/problems" className="btn btn-primary">Problems</Link>
            <Link to="/simple-editor" className="btn btn-primary">Start Coding</Link>
            <Link to="/contests" className="btn btn-primary">Contests</Link>
            <Link to="/duel" className="btn btn-primary">1 vs 1 Duel</Link>
            <Link to="/teams" className="btn btn-primary">Team Battles</Link>
            <Link to="/about" className="btn btn-secondary">Learn More</Link>
          </div>
        </div>
      </section>

      {/* Floating Words */}
      <div className="floating-words">
        {[
          "console.log","return","import","function","class","debug","await",
          "merge","deploy","API","boolean","array.map","forEach","useState","git push"
        ].map((w, i) => (
          <span key={i} className="word" style={{
            left: `${5 + (i * 7)}%`,
            top: `${10 + (i * 4)}%`,
            animationDelay: `${i * 0.7}s`
          }}>{w}</span>
        ))}
      </div>
    </>
  );
};

export default LandingPage;
