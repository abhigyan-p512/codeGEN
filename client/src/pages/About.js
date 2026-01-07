import React, { useEffect } from "react";
import { Link } from "react-router-dom";

const About = () => {
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    }, observerOptions);

    document.querySelectorAll(".fade-in-up").forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);


  return (
    <>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: #0a0a0a;
          color: #fff;
          overflow-x: hidden;
        }

        .about-bg {
          position: fixed;
          inset: 0;
          background: 
            radial-gradient(circle at 30% 20%, rgba(0, 242, 255, 0.06) 0%, transparent 50%),
            radial-gradient(circle at 70% 60%, rgba(157, 77, 255, 0.06) 0%, transparent 50%),
            radial-gradient(circle at 50% 90%, rgba(0, 255, 153, 0.04) 0%, transparent 50%);
          pointer-events: none;
          z-index: 0;
        }

        .about-page-root {
          position: relative;
          margin-top: 100px;
          min-height: calc(100vh - 100px);
          padding: 60px 20px 80px;
          z-index: 1;
        }

        .about-page {
          max-width: 1200px;
          margin: 0 auto;
        }

        .about-header {
          text-align: center;
          margin-bottom: 80px;
        }

        .about-title {
          font-size: clamp(3rem, 6vw, 5rem);
          font-weight: 900;
          margin-bottom: 24px;
          background: linear-gradient(135deg, #00f2ff 0%, #00ff99 50%, #9d4dff 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          letter-spacing: -2px;
          line-height: 1.1;
        }

        .about-subtitle {
          max-width: 800px;
          margin: 0 auto;
          font-size: clamp(17px, 2.5vw, 20px);
          color: #b0b0b0;
          line-height: 1.7;
          font-weight: 400;
        }

        .stats-bar {
          display: flex;
          justify-content: center;
          gap: 60px;
          flex-wrap: wrap;
          margin-top: 50px;
          padding: 40px 20px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          backdrop-filter: blur(10px);
        }

        .stat-item {
          text-align: center;
        }

        .stat-number {
          font-size: clamp(2.5rem, 4vw, 3.5rem);
          font-weight: 900;
          background: linear-gradient(135deg, #00f2ff, #00ff99);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          display: block;
          margin-bottom: 8px;
        }

        .stat-label {
          font-size: 15px;
          color: #808080;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 600;
        }

        .about-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 30px;
          margin-bottom: 80px;
        }

        .about-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 24px;
          padding: 40px;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .about-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(0, 242, 255, 0.05), rgba(157, 77, 255, 0.05));
          opacity: 0;
          transition: opacity 0.4s;
        }

        .about-card:hover {
          transform: translateY(-8px);
          border-color: rgba(0, 242, 255, 0.3);
          box-shadow: 0 20px 60px rgba(0, 242, 255, 0.2);
        }

        .about-card:hover::before {
          opacity: 1;
        }

        .card-icon {
          font-size: 48px;
          margin-bottom: 20px;
          display: block;
        }

        .about-card h2 {
          font-size: 26px;
          font-weight: 700;
          margin-bottom: 16px;
          color: #00f2ff;
          position: relative;
        }

        .about-card p {
          font-size: 16px;
          line-height: 1.7;
          color: #b0b0b0;
          position: relative;
        }

        .about-card ul {
          list-style: none;
          padding: 0;
          margin-top: 12px;
          position: relative;
        }

        .about-card ul li {
          margin-bottom: 12px;
          font-size: 16px;
          color: #b0b0b0;
          padding-left: 28px;
          position: relative;
          line-height: 1.6;
        }

        .about-card ul li::before {
          content: '→';
          position: absolute;
          left: 0;
          color: #00ff99;
          font-weight: 700;
        }

        .features-showcase {
          margin-bottom: 80px;
        }

        .showcase-title {
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 800;
          text-align: center;
          margin-bottom: 50px;
          background: linear-gradient(135deg, #fff, #808080);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .feature-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
          margin-bottom: 24px;
        }

        .feature-pill {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 24px 28px;
          display: flex;
          align-items: center;
          gap: 16px;
          transition: all 0.3s ease;
        }

        .feature-pill:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(0, 242, 255, 0.3);
          transform: translateX(8px);
        }

        .feature-pill-icon {
          font-size: 32px;
          flex-shrink: 0;
        }

        .feature-pill-text {
          font-size: 17px;
          color: #d0d0d0;
          font-weight: 500;
        }

        .developers-section {
          margin-bottom: 80px;
          text-align: center;
        }

        .developers-title {
          font-size: clamp(2.5rem, 5vw, 3.5rem);
          font-weight: 900;
          margin-bottom: 50px;
          color: #fff;
          letter-spacing: -1px;
        }

        .developers-container {
          max-width: 1000px;
          margin: 0 auto;
        }

        .developers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 30px;
          margin-bottom: 40px;
        }

        .developer-card {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 20px;
          padding: 40px 30px;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .developer-card:hover {
          transform: translateY(-6px);
          background: rgba(255, 255, 255, 0.12);
          box-shadow: 0 16px 48px rgba(0, 242, 255, 0.2);
        }

        .developer-avatar {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: linear-gradient(135deg, #00f2ff, #00ff99);
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
          font-weight: 700;
          color: #000;
          border: 4px solid rgba(255, 255, 255, 0.1);
        }

        .developer-name {
          font-size: 22px;
          font-weight: 700;
          color: #fff;
          margin-bottom: 8px;
        }

        .developer-role {
          font-size: 16px;
          color: #00f2ff;
          margin-bottom: 12px;
          font-weight: 600;
        }

        .developer-description {
          font-size: 15px;
          color: #b0b0b0;
          line-height: 1.6;
          text-align: center;
        }

        .developer-usn {
          font-size: 14px;
          color: #808080;
          margin-top: 8px;
        }

        .institution-info {
          margin-top: 40px;
          padding-top: 30px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .institution-name {
          font-size: 18px;
          font-weight: 600;
          color: #d0d0d0;
          margin-bottom: 6px;
        }

        .institution-location {
          font-size: 16px;
          color: #808080;
        }

        .about-footer {
          text-align: center;
          padding: 60px 20px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 24px;
          backdrop-filter: blur(10px);
        }

        .footer-title {
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 800;
          margin-bottom: 16px;
          background: linear-gradient(135deg, #00f2ff, #00ff99);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .footer-subtitle {
          font-size: 18px;
          color: #b0b0b0;
          margin-bottom: 36px;
        }

        .about-actions {
          display: flex;
          justify-content: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .btn {
          padding: 16px 32px;
          border-radius: 14px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: none;
          text-decoration: none;
          position: relative;
          overflow: hidden;
        }

        .btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.1), transparent);
          opacity: 0;
          transition: opacity 0.3s;
        }

        .btn:hover::before {
          opacity: 1;
        }

        .btn-primary {
          background: linear-gradient(135deg, #00f2ff, #00ff99);
          color: #000;
          box-shadow: 0 8px 32px rgba(0, 242, 255, 0.3);
        }

        .btn-primary:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0, 242, 255, 0.5);
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
          border: 2px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-4px);
        }

        .fade-in-up {
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.8s ease;
        }

        .fade-in-up.visible {
          opacity: 1;
          transform: translateY(0);
        }

        @media (max-width: 768px) {
          .about-page-root {
            padding: 40px 16px 60px;
          }

          .stats-bar {
            gap: 40px;
            padding: 30px 16px;
          }

          .about-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .about-card {
            padding: 30px;
          }

          .feature-row {
            grid-template-columns: 1fr;
          }

          .feature-pill:hover {
            transform: translateX(0);
          }

          .developers-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .developer-card {
            padding: 30px 20px;
          }

          .developer-avatar {
            width: 100px;
            height: 100px;
            font-size: 40px;
          }
        }
      `}</style>

      <div className="about-bg"></div>

      <div className="about-page-root">
        <div className="about-page">
          {/* Header Section */}
          <div className="about-header fade-in-up">
            <h1 className="about-title">About CodeGen4Future</h1>
            <p className="about-subtitle">
              A next-generation competitive programming platform designed for students, developers, 
              and teams who want to master algorithms, compete globally, and build their coding legacy. 
              Built with cutting-edge technology to provide real-time coding experiences, instant feedback, 
              and collaborative learning opportunities.
            </p>
          </div>

          {/* Main Cards */}
          <div className="about-grid">
            <div className="about-card fade-in-up">
              <span className="card-icon">🎯</span>
              <h2>Our Mission</h2>
              <p>
                To democratize competitive programming by providing a fast, intuitive, 
                and feature-rich platform where anyone can practice, compete, and excel 
                in coding interviews and real-world challenges. We believe coding should 
                be accessible, engaging, and collaborative. CodeGen4Future bridges the 
                gap between learning and competing, making algorithmic problem-solving 
                an enjoyable journey for everyone.
              </p>
            </div>

            <div className="about-card fade-in-up">
              <span className="card-icon">⚡</span>
              <h2>What You Can Do</h2>
              <ul>
                <li>Solve curated DSA problems with instant feedback and test case validation</li>
                <li>Compete in live contests with real-time leaderboards and rankings</li>
                <li>Challenge friends in 1v1 coding duels with synchronized problem solving</li>
                <li>Join team battles and collaborative tournaments</li>
                <li>Track your progress with detailed analytics and submission history</li>
                <li>Use our powerful Monaco code editor with syntax highlighting</li>
                <li>Code in multiple languages: C++, Java, Python, JavaScript</li>
              </ul>
            </div>

            <div className="about-card fade-in-up">
              <span className="card-icon">🎓</span>
              <h2>For Students</h2>
              <p>
                Built with campus placements and coding interviews in mind. Master data 
                structures, sharpen your algorithms, and build the confidence you need 
                to ace technical rounds at top companies. Practice with problems ranging 
                from basic to advanced levels, get detailed explanations, and learn from 
                your mistakes with comprehensive error analysis.
              </p>
            </div>
          </div>

          {/* Features Showcase */}
          <div className="features-showcase fade-in-up">
            <h2 className="showcase-title">Platform Highlights</h2>
            
            <div className="feature-row">
              <div className="feature-pill">
                <span className="feature-pill-icon">🚀</span>
                <span className="feature-pill-text">Blazing-fast code execution with Docker sandboxing</span>
              </div>
              <div className="feature-pill">
                <span className="feature-pill-icon">💻</span>
                <span className="feature-pill-text">Multi-language support (C++, Java, Python, JavaScript)</span>
              </div>
              <div className="feature-pill">
                <span className="feature-pill-icon">🏆</span>
                <span className="feature-pill-text">Real-time leaderboards and rankings</span>
              </div>
            </div>

            <div className="feature-row">
              <div className="feature-pill">
                <span className="feature-pill-icon">🎨</span>
                <span className="feature-pill-text">Monaco Editor with syntax highlighting</span>
              </div>
              <div className="feature-pill">
                <span className="feature-pill-icon">📊</span>
                <span className="feature-pill-text">Detailed performance analytics and submission tracking</span>
              </div>
              <div className="feature-pill">
                <span className="feature-pill-icon">🔥</span>
                <span className="feature-pill-text">Curated problem sets from easy to expert</span>
              </div>
            </div>
          </div>

          {/* Developers Section */}
          <div className="developers-section fade-in-up">
            <h2 className="developers-title">Our Team</h2>
            <div className="developers-container">
              <div className="developers-grid">
                <div className="developer-card">
                  <div className="developer-avatar">AP</div>
                  <div className="developer-name">Abhigyan Prakash</div>
                  <div className="developer-role">Developer</div>
                  <div className="developer-description">
                    Information science engineering student at CMR Institute of Technology, Bangalore.
                  </div>
                  <div className="developer-usn">USN: 1CR22IS003</div>
                </div>
                <div className="developer-card">
                  <div className="developer-avatar">AS</div>
                  <div className="developer-name">Abhinav Singh</div>
                  <div className="developer-role">Developer</div>
                  <div className="developer-description">
                    Information science engineering student at CMR Institute of Technology, Bangalore.
                  </div>
                  <div className="developer-usn">USN: 1CR22IS005</div>
                </div>
                <div className="developer-card">
                  <div className="developer-avatar">BS</div>
                  <div className="developer-name">Bhuvana S</div>
                  <div className="developer-role">Developer</div>
                  <div className="developer-description">
                    Information science engineering student at CMR Institute of Technology, Bangalore.
                  </div>
                  <div className="developer-usn">USN: 1CR22IS034</div>
                </div>
              </div>
              
            </div>
          </div>

          {/* Footer CTA */}
          <div className="about-footer fade-in-up">
            <h2 className="footer-title">Ready to Level Up?</h2>
            <p className="footer-subtitle">
              Join thousands of developers already sharpening their skills
            </p>
            <div className="about-actions">
              <Link to="/problems" className="btn btn-primary">
                Explore Problems
              </Link>
              <Link to="/contests" className="btn btn-primary">
                Join Contests
              </Link>
              <Link to="/duel" className="btn btn-secondary">
                1v1 Duel
              </Link>
              <Link to="/team-battle" className="btn btn-secondary">
                Team Battles
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default About;