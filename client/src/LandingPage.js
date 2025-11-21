// src/LandingPage.js
import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import "./styles.css";

const LandingPage = () => {
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
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    }, observerOptions);

    document.querySelectorAll(".fade-in").forEach((el) => {
      observer.observe(el);
    });

    const handleScroll = () => {
      const navbar = document.querySelector(".navbar");
      if (!navbar) return;
      navbar.style.background =
        window.scrollY > 100 ? "rgba(10,10,10,0.95)" : "rgba(10,10,10,0.9)";
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.removeEventListener("click", handleSmoothScroll);
      });
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <>
      <div className="bg-pattern"></div>

      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="logo">CodeGen4Future</div>
          <ul className="nav-menu">
            <li>
              <a href="#features">Features</a>
            </li>
            <li>
              <a href="#languages">Languages</a>
            </li>
            <li>
              <a href="#how-it-works">How It Works</a>
            </li>
            <li>
              <a href="#community">Community</a>
            </li>
            <li>
              <Link to="/problems" className="nav-btn">
                Problems
              </Link>
            </li>
            <li>
              <Link to="/contests" className="nav-btn">
                Contests
              </Link>
            </li>
            <Link to="/leaderboard" style={{ marginRight: 10 }}>Leaderboard</Link>

          </ul>
        </div>
      </nav>

   {/* Hero Section */}
<section className="hero">
  <div className="hero-content">
    <h1>Code, Compile, Collaborate — Anywhere.</h1>
    <p>The future of coding is in your browser.</p>

    <div className="cta-buttons" style={{ marginTop: "20px", display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
      
      <Link to="/problems" className="btn btn-primary">
        Problems
      </Link>

      <Link to="/simple-editor" className="btn btn-secondary">
        Start Coding
      </Link>

      <Link to="/contests" className="btn btn-primary">
        Contests
      </Link>

      <Link to="/duel" className="btn btn-primary">
        1 vs 1 Duel
      </Link>

      <Link to="/teams" className="btn btn-primary">
        Team Battles
      </Link>

      <a href="#features" className="btn btn-secondary">
        Learn More
      </a>
    </div>
  </div>
</section>


      {/* Floating Words */}
      <div className="floating-words">
        <span
          className="word"
          style={{ "--delay": "0s", "--x": "10%", "--y": "15%" }}
        >
          function
        </span>
        <span
          className="word"
          style={{ "--delay": "2s", "--x": "85%", "--y": "25%" }}
        >
          async
        </span>
        <span
          className="word"
          style={{ "--delay": "1s", "--x": "20%", "--y": "70%" }}
        >
          console.log
        </span>
        <span
          className="word"
          style={{ "--delay": "3s", "--x": "75%", "--y": "60%" }}
        >
          import
        </span>
        <span
          className="word"
          style={{ "--delay": "1.5s", "--x": "40%", "--y": "20%" }}
        >
          class
        </span>
        <span
          className="word"
          style={{ "--delay": "4s", "--x": "60%", "--y": "80%" }}
        >
          return
        </span>
        <span
          className="word"
          style={{ "--delay": "0.5s", "--x": "90%", "--y": "45%" }}
        >
          const
        </span>
        <span
          className="word"
          style={{ "--delay": "2.5s", "--x": "15%", "--y": "50%" }}
        >
          array.map
        </span>
        <span
          className="word"
          style={{ "--delay": "3.5s", "--x": "50%", "--y": "10%" }}
        >
          useState
        </span>
        <span
          className="word"
          style={{ "--delay": "1.8s", "--x": "80%", "--y": "75%" }}
        >
          API
        </span>
        <span
          className="word"
          style={{ "--delay": "2.8s", "--x": "25%", "--y": "85%" }}
        >
          JSON
        </span>
        <span
          className="word"
          style={{ "--delay": "0.8s", "--x": "95%", "--y": "30%" }}
        >
          forEach
        </span>
        <span
          className="word"
          style={{ "--delay": "4.5s", "--x": "35%", "--y": "90%" }}
        >
          git push
        </span>
        <span
          className="word"
          style={{ "--delay": "1.2s", "--x": "70%", "--y": "15%" }}
        >
          await
        </span>
        <span
          className="word"
          style={{ "--delay": "3.8s", "--x": "5%", "--y": "65%" }}
        >
          merge
        </span>
        <span
          className="word"
          style={{ "--delay": "2.2s", "--x": "55%", "--y": "40%" }}
        >
          debug
        </span>
        <span
          className="word"
          style={{ "--delay": "4.2s", "--x": "85%", "--y": "85%" }}
        >
          deploy
        </span>
        <span
          className="word"
          style={{ "--delay": "1.7s", "--x": "30%", "--y": "35%" }}
        >
          algorithm
        </span>
        <span
          className="word"
          style={{ "--delay": "2.2s", "--x": "65%", "--y": "65%" }}
        >
          boolean
        </span>
        <span
          className="word"
          style={{ "--delay": "0.3s", "--x": "45%", "--y": "55%" }}
        >
          variable
        </span>
      </div>
    </>
  );
};

export default LandingPage;
