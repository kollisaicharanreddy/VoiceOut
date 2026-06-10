import { useState, useEffect } from 'react';
import AdminDashboard from './pages/AdminDashboard';
import Submit from './pages/Submit';
import SurveyForm from './pages/SurveyForm';
import Navbar from './components/Navbar';

export default function App() {
  const [lastTrackingCode, setLastTrackingCode] = useState('');
  const [view, setView] = useState('home'); // 'home', 'admin', or 'survey'
  const [surveyToken, setSurveyToken] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('surveyToken') || params.get('token');
    if (token) {
      setSurveyToken(token);
      setView('survey');
    }
  }, []);

  const handleCloseSurvey = () => {
    setView('home');
    setSurveyToken('');
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  return (
    <div className="app-shell">
      <Navbar currentView={view} onNavigate={(v) => {
        if (v === 'home') {
          // If we navigate away from survey manually, clean up token
          setSurveyToken('');
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        setView(v);
      }} />

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
        {view === 'home' && <Submit onSubmitted={setLastTrackingCode} />}
        {view === 'admin' && <AdminDashboard onExit={() => setView('home')} />}
        {view === 'survey' && <SurveyForm token={surveyToken} onClose={handleCloseSurvey} />}
      </main>
    </div>
  );
}