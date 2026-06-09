import React from 'react';

export default function Navbar({ currentView, onNavigate = () => {} }) {
  return (
    <nav className="topbar">
      <div className="topbar-inner">
        <div className="brand" onClick={() => onNavigate('home')}>VoiceOut</div>
        <div className="nav-links">
          <button 
            className={`ghost-button ${currentView === 'home' ? 'active' : ''}`} 
            onClick={() => onNavigate('home')}
          >
            Submit
          </button>
          <button 
            className={`ghost-button ${currentView === 'admin' ? 'active' : ''}`} 
            onClick={() => onNavigate('admin')}
          >
            Admin
          </button>
        </div>
      </div>
    </nav>
  );
}
