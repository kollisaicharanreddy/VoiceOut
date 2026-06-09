import { useEffect, useMemo, useState } from 'react';
import { addComplaintNote, getComplaintDetail, getSimilarComplaints, listComplaints, updateComplaintStatus, adminLogin } from '../api';
import StatusBadge from '../components/StatusBadge';

const DEFAULT_AUTH = { username: '', password: '' };
const STATUS_OPTIONS = ['NEW', 'IN_REVIEW', 'RESOLVED', 'REJECTED'];

export default function AdminDashboard({ onExit }) {
  const [auth, setAuth] = useState(() => {
    const stored = sessionStorage.getItem('voiceout-admin-auth');
    return stored ? JSON.parse(stored) : DEFAULT_AUTH;
  });
  const [draftAuth, setDraftAuth] = useState(auth);
  const [authenticated, setAuthenticated] = useState(Boolean(auth.username && auth.password));
  const [statusFilter, setStatusFilter] = useState('');
  const [complaints, setComplaints] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [detail, setDetail] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authenticated) {
      void refreshList();
    }
  }, [authenticated, statusFilter]);

  useEffect(() => {
    if (selectedId && authenticated) {
      void refreshDetail(selectedId);
    }
  }, [selectedId, authenticated]);

  async function refreshList() {
    setBusy(true);
    setError('');
    try {
      const data = await listComplaints(auth, statusFilter || undefined);
      setComplaints(data);
      if (data.length > 0 && !data.some((item) => item.id === selectedId)) {
        setSelectedId(data[0].id);
      }
      if (data.length === 0) {
        setSelectedId('');
        setDetail(null);
        setSimilar([]);
      }
    } catch (dashboardError) {
      setError(dashboardError.message || 'Unable to load complaints');
      // Only reset auth if the server explicitly rejected credentials
      if (dashboardError?.status === 401) {
        setAuthenticated(false);
        sessionStorage.removeItem('voiceout-admin-auth');
      }
    } finally {
      setBusy(false);
    }
  }

  async function refreshDetail(complaintId) {
    setBusy(true);
    setError('');
    setSimilar([]);
    try {
      const data = await getComplaintDetail(auth, complaintId);
      setDetail(data);
      setNote('');
    } catch (detailError) {
      setError(detailError.message || 'Unable to load complaint detail');
      if (detailError?.status === 401) {
        setAuthenticated(false);
        sessionStorage.removeItem('voiceout-admin-auth');
      }
      setBusy(false);
      return;
    }

    try {
      const similarity = await getSimilarComplaints(auth, complaintId);
      setSimilar(similarity);
    } catch (similarityError) {
      console.warn("Similarity fetch skipped (embedding pending):", similarityError.message);
    } finally {
      setBusy(false);
    }
  }

  function login(event) {
    event.preventDefault();
    const nextAuth = {
      username: draftAuth.username.trim(),
      password: draftAuth.password
    };
    (async () => {
      setBusy(true);
      setError('');
      try {
        // call session-based login endpoint
        await adminLogin(nextAuth.username, nextAuth.password);
        // store credentials for backward-compat (still used by api for header fallback)
        setAuth(nextAuth);
        sessionStorage.setItem('voiceout-admin-auth', JSON.stringify(nextAuth));
        setAuthenticated(true);
      } catch (e) {
        setError(e.message || 'Invalid credentials');
        setAuthenticated(false);
      } finally {
        setBusy(false);
      }
    })();
  }

  async function changeStatus(status) {
    if (!detail) {
      return;
    }

    setBusy(true);
    try {
      const updated = await updateComplaintStatus(auth, detail.id, status);
      setDetail(updated);
      setComplaints((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (statusError) {
      setError(statusError.message || 'Unable to update status');
    } finally {
      setBusy(false);
    }
  }

  async function submitNote(event) {
    event.preventDefault();
    if (!detail || !note.trim()) {
      return;
    }

    setBusy(true);
    try {
      const updated = await addComplaintNote(auth, detail.id, note);
      setDetail(updated);
      setComplaints((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setNote('');
    } catch (noteError) {
      setError(noteError.message || 'Unable to add note');
    } finally {
      setBusy(false);
    }
  }

  if (!authenticated) {
    // Render a modal-style login so the browser won't trigger native basic-auth dialogs.
    return (
      <section className="panel admin-panel">
        <div className="panel-label">Admin access</div>
        <h2>Review complaints with basic auth.</h2>
        <p className="muted">Use the seeded admin account from the backend config or your configured environment values.</p>

        <div className="modal-overlay">
          <div className="modal-card">
            <form className="stack" onSubmit={login}>
              <label className="field">
                <span>Username</span>
                <input
                  value={draftAuth.username}
                  onChange={(event) => setDraftAuth((current) => ({ ...current, username: event.target.value }))}
                  autoComplete="username"
                  required
                />
              </label>
              <label className="field">
                <span>Password</span>
                <input
                  type="password"
                  value={draftAuth.password}
                  onChange={(event) => setDraftAuth((current) => ({ ...current, password: event.target.value }))}
                  autoComplete="current-password"
                  required
                />
              </label>

              {error ? <div className="notice error">{error}</div> : null}

              <div className="row-between">
                <button className="secondary-button" type="submit">Sign in</button>
                <button className="ghost-button" type="button" onClick={() => onExit?.()}>Back</button>
              </div>
            </form>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="panel admin-panel">
      <div className="panel-header">
        <div>
          <div className="panel-label">Admin review</div>
          <h2>Complaint queue</h2>
        </div>
        <button
          className="ghost-button"
          type="button"
          onClick={() => {
            setAuthenticated(false);
            sessionStorage.removeItem('voiceout-admin-auth');
          }}
        >
          Lock screen
        </button>
      </div>

      <div className="admin-toolbar">
        <label className="field compact">
          <span>Status filter</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">All</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <span className="helper">{complaints.length} complaints loaded</span>
      </div>

      {error ? <div className="notice error">{error}</div> : null}

      <div className="admin-layout">
        <aside className="list-panel">
          {busy && complaints.length === 0 ? <div className="empty-state">Loading queue...</div> : null}
          {complaints.map((complaint) => (
            <button
              key={complaint.id}
              type="button"
              className={`complaint-card ${complaint.id === selectedId ? 'active' : ''}`}
              onClick={() => setSelectedId(complaint.id)}
            >
              <div className="card-topline">
                <strong>{complaint.trackingCode}</strong>
                <StatusBadge value={complaint.status} />
              </div>
              <p>{complaint.aiSummary || 'No summary yet.'}</p>
              <div className="card-meta">
                <span>{complaint.enrichmentStatus}</span>
                <span>{new Date(complaint.createdAt).toLocaleString()}</span>
              </div>
            </button>
          ))}

          {!busy && complaints.length === 0 ? <div className="empty-state">No complaints match the current filter.</div> : null}
        </aside>

        <article className="detail-panel">
          {detail ? (
            <>
              <div className="detail-header">
                <div>
                  <div className="panel-label">Selected complaint</div>
                  <h3>{detail.trackingCode}</h3>
                </div>
                <StatusBadge value={detail.status} />
              </div>

              <p className="detail-content">{detail.content}</p>

              <div className="detail-grid">
                <div>
                  <span className="helper">Category</span>
                  <div>{detail.aiCategory || 'Not assigned'}</div>
                </div>
                <div>
                  <span className="helper">Enrichment</span>
                  <div>{detail.enrichmentStatus}</div>
                </div>
                <div>
                  <span className="helper">Confidence</span>
                  <div>{detail.aiConfidence ? `${Math.round(detail.aiConfidence * 100)}%` : 'N/A'}</div>
                </div>
                <div>
                  <span className="helper">Vector</span>
                  <div>{detail.embeddingAvailable ? 'Available' : 'Pending'}</div>
                </div>
              </div>

              <label className="field compact">
                <span>Update status</span>
                <select value={detail.status} onChange={(event) => void changeStatus(event.target.value)}>
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>

              <form className="stack" onSubmit={submitNote}>
                <label className="field">
                  <span>Add note</span>
                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Log a triage note or internal follow-up task."
                    rows={4}
                  />
                </label>
                <button className="secondary-button" type="submit" disabled={!note.trim()}>
                  Save note
                </button>
              </form>

              <div className="notes-stack">
                <h4>Notes</h4>
                {detail.notes.length === 0 ? <div className="empty-state">No internal notes yet.</div> : null}
                {detail.notes.map((entry) => (
                  <div className="note-item" key={entry.id}>
                    <p>{entry.note}</p>
                    <span>{new Date(entry.createdAt).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="notes-stack">
                <h4>Similar complaints</h4>
                {similar.length === 0 ? <div className="empty-state">No comparable records available yet.</div> : null}
                {similar.map((entry) => (
                  <div className="note-item" key={entry.id}>
                    <div className="card-topline">
                      <strong>{entry.trackingCode}</strong>
                      <span className="helper">{Math.round(entry.similarity * 100)}%</span>
                    </div>
                    <p>{entry.aiSummary || 'No summary available.'}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state">Select a complaint to review its detail view.</div>
          )}
        </article>
      </div>
    </section>
  );
}