import { useState } from 'react';
import AdminDashboard from './pages/AdminDashboard';
import Submit from './pages/Submit';
import Navbar from './components/Navbar';

export default function App() {
  const [lastTrackingCode, setLastTrackingCode] = useState('');
  const [view, setView] = useState('home'); // 'home' or 'admin'

  return (
    <div className="app-shell">
      <Navbar currentView={view} onNavigate={(v) => setView(v)} />

      {view === 'home' && (
        <header className="hero">
          <div className="hero-copy">
            <div className="eyebrow">VoiceOut</div>
            <h1>Anonymous complaint tracking with a minimal admin workflow.</h1>
            <p>
              Submit a concern, keep the tracking code, and let the admin dashboard handle review, notes, status changes,
              and similarity lookups.
            </p>
          </div>

          <div className="hero-card">
            <span className="helper">Latest submission</span>
            <strong>{lastTrackingCode || 'No complaint submitted yet'}</strong>
          </div>
        </header>
      )}

      <main className={view === 'home' ? "grid-layout" : "full-layout"}>
        {view === 'home' ? <Submit onSubmitted={setLastTrackingCode} /> : <AdminDashboard onExit={() => setView('home')} />}
      </main>
    </div>
  );
}