import React from 'react';
import { Link } from 'react-router-dom';
import SimpleCodeEditor from '../components/SimpleCodeEditor';
import '../styles.css';

const SimpleEditorPage = () => {
  return (
    <>
      <div className="bg-pattern"></div>
      
      {/* Simple Header */}
      <header className="simple-header">
        <div className="header-container">
          <Link to="/" className="logo-link">
            <div className="logo">CodeGen4Future</div>
          </Link>
          <nav className="simple-nav">
            <Link to="/" className="nav-link">← Back to Home</Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="simple-main">
        <SimpleCodeEditor />
      </main>
    </>
  );
};

export default SimpleEditorPage;
