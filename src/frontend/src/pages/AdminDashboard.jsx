import { useEffect, useMemo, useState } from 'react';
import { addComplaintNote, getComplaintDetail, listComplaints, updateComplaintStatus, adminLogin, adminListSurveys, adminGetSurveyDetails, adminCreateSurvey } from '../api';
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
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Surveys state variables
  const [adminTab, setAdminTab] = useState('complaints'); // 'complaints' or 'surveys'
  const [surveys, setSurveys] = useState([]);
  const [selectedSurveyId, setSelectedSurveyId] = useState('');
  const [surveyDetail, setSurveyDetail] = useState(null);
  const [surveySubTab, setSurveySubTab] = useState('responses'); // 'responses' or 'invitations'
  
  // For creating survey
  const [isCreatingSurvey, setIsCreatingSurvey] = useState(false);
  const [newSurveyTitle, setNewSurveyTitle] = useState('');
  const [newSurveyDescription, setNewSurveyDescription] = useState('');
  const [newSurveyQuestions, setNewSurveyQuestions] = useState([{ text: '', type: 'DESCRIPTIVE', optionsString: '' }]);
  const [addEmails, setAddEmails] = useState('');
  const [addingInvites, setAddingInvites] = useState(false);
  const [newSurveyEmails, setNewSurveyEmails] = useState('');

  useEffect(() => {
    if (authenticated) {
      if (adminTab === 'complaints') {
        void refreshList();
      } else {
        void refreshSurveysList();
      }
    }
  }, [authenticated, statusFilter, adminTab]);

  useEffect(() => {
    if (selectedId && authenticated && adminTab === 'complaints') {
      void refreshDetail(selectedId);
    }
  }, [selectedId, authenticated, adminTab]);

  useEffect(() => {
    if (selectedSurveyId && authenticated && adminTab === 'surveys') {
      void refreshSurveyDetail(selectedSurveyId);
    }
  }, [selectedSurveyId, authenticated, adminTab]);

  async function refreshSurveysList() {
    setBusy(true);
    setError('');
    try {
      const data = await adminListSurveys(auth);
      setSurveys(data);
      if (data.length > 0 && !data.some((item) => item.id === selectedSurveyId)) {
        setSelectedSurveyId(data[0].id);
      }
      if (data.length === 0) {
        setSelectedSurveyId('');
        setSurveyDetail(null);
      }
    } catch (err) {
      setError(err.message || 'Unable to load surveys');
      if (err?.status === 401) {
        setAuthenticated(false);
        sessionStorage.removeItem('voiceout-admin-auth');
      }
    } finally {
      setBusy(false);
    }
  }

  async function refreshSurveyDetail(surveyId) {
    setBusy(true);
    setError('');
    try {
      const data = await adminGetSurveyDetails(auth, surveyId);
      setSurveyDetail(data);
    } catch (err) {
      setError(err.message || 'Unable to load survey details');
      if (err?.status === 401) {
        setAuthenticated(false);
        sessionStorage.removeItem('voiceout-admin-auth');
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateSurvey(event) {
    event.preventDefault();
    if (!newSurveyTitle.trim()) return;
    const questions = newSurveyQuestions
      .filter((q) => q.text.trim())
      .map((q) => ({
        text: q.text.trim(),
        type: q.type,
        options: (q.type === 'SINGLE_CHOICE' || q.type === 'MULTIPLE_CHOICE')
          ? q.optionsString.split(',').map((o) => o.trim()).filter(Boolean)
          : []
      }));

    if (questions.length === 0) {
      setError('Please add at least one question.');
      return;
    }
    const emails = newSurveyEmails
      .split(/[\n,]+/)
      .map((e) => e.trim())
      .filter((e) => e.length > 0);
    if (emails.length === 0) {
      setError('Please enter at least one recipient email.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      const created = await adminCreateSurvey(auth, {
        title: newSurveyTitle.trim(),
        description: newSurveyDescription.trim(),
        questions,
        emails
      });
      setSurveys((prev) => [
        {
          id: created.id,
          title: created.title,
          description: created.description,
          responseCount: 0,
          invitationCount: created.tokens.length,
          createdAt: created.createdAt
        },
        ...prev
      ]);
      setSelectedSurveyId(created.id);
      setSurveyDetail(created);
      setIsCreatingSurvey(false);
      setNewSurveyTitle('');
      setNewSurveyDescription('');
      setNewSurveyQuestions([{ text: '', type: 'DESCRIPTIVE', optionsString: '' }]);
      setNewSurveyEmails('');
    } catch (err) {
      setError(err.message || 'Failed to create survey.');
    } finally {
      setBusy(false);
    }
  }

  async function handleAddInvitations(event) {
    event.preventDefault();
    const emails = addEmails
      .split(/[\n,]+/)
      .map((e) => e.trim())
      .filter((e) => e.length > 0);
    if (emails.length === 0) {
      return;
    }

    setAddingInvites(true);
    setError('');
    try {
      const addedTokens = await adminAddSurveyInvitations(auth, surveyDetail.id, emails);
      setSurveyDetail((prev) => ({
        ...prev,
        tokens: [...prev.tokens, ...addedTokens]
      }));
      setSurveys((prev) =>
        prev.map((s) =>
          s.id === surveyDetail.id ? { ...s, invitationCount: s.invitationCount + addedTokens.length } : s
        )
      );
      setAddEmails('');
      alert(`Successfully added ${addedTokens.length} invitations!`);
    } catch (err) {
      setError(err.message || 'Failed to add invitations.');
    } finally {
      setAddingInvites(false);
    }
  }

  function exportResponsesToCSV() {
    if (!surveyDetail || surveyDetail.responses.length === 0) return;

    let headers;
    let rows;

    if (surveyDetail.questions && surveyDetail.questions.length > 0) {
      // Normal case: Use actual question texts as headers
      headers = surveyDetail.questions.map((q) => `"${q.text.replace(/"/g, '""')}"`);
      headers.unshift('"Submission Time"');

      rows = surveyDetail.responses.map((response) => {
        const rowAnswers = surveyDetail.questions.map((q, idx) => {
          const ans = response.answers[idx] || '';
          return `"${ans.replace(/"/g, '""')}"`;
        });
        rowAnswers.unshift(`"${new Date(response.submittedAt).toLocaleString().replace(/"/g, '""')}"`);
        return rowAnswers.join(',');
      });
    } else {
      // Fallback: If questions list is empty (e.g. old surveys created before migration)
      // Determine the maximum number of answers across all responses
      const maxAnswers = Math.max(...surveyDetail.responses.map((r) => r.answers.length), 0);
      
      headers = [];
      for (let i = 1; i <= maxAnswers; i++) {
        headers.push(`"Answer ${i}"`);
      }
      headers.unshift('"Submission Time"');

      rows = surveyDetail.responses.map((response) => {
        const rowAnswers = response.answers.map((ans) => `"${(ans || '').replace(/"/g, '""')}"`);
        rowAnswers.unshift(`"${new Date(response.submittedAt).toLocaleString().replace(/"/g, '""')}"`);
        return rowAnswers.join(',');
      });
    }

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${surveyDetail.title.replace(/\s+/g, '_')}_responses.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

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
          <h2>{adminTab === 'complaints' ? 'Complaint queue' : 'Feedback surveys'}</h2>
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

      <div className="admin-toolbar" style={{ borderBottom: '1px solid var(--panel-border)', paddingBottom: '16px', marginBottom: '8px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            className={`secondary-button ${adminTab === 'complaints' ? 'active' : ''}`}
            style={{ borderRadius: '12px', background: adminTab === 'complaints' ? 'rgba(214, 163, 72, 0.18)' : 'transparent', color: adminTab === 'complaints' ? 'var(--accent-strong)' : 'var(--text)', border: '1px solid ' + (adminTab === 'complaints' ? 'var(--accent)' : 'var(--panel-border)'), padding: '8px 16px', cursor: 'pointer' }}
            onClick={() => {
              setAdminTab('complaints');
              setIsCreatingSurvey(false);
            }}
          >
            Complaints Queue
          </button>
          <button
            className={`secondary-button ${adminTab === 'surveys' ? 'active' : ''}`}
            style={{ borderRadius: '12px', background: adminTab === 'surveys' ? 'rgba(214, 163, 72, 0.18)' : 'transparent', color: adminTab === 'surveys' ? 'var(--accent-strong)' : 'var(--text)', border: '1px solid ' + (adminTab === 'surveys' ? 'var(--accent)' : 'var(--panel-border)'), padding: '8px 16px', cursor: 'pointer' }}
            onClick={() => setAdminTab('surveys')}
          >
            Feedback Surveys
          </button>
        </div>
      </div>

      {adminTab === 'complaints' && (
        <>
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


                </>
              ) : (
                <div className="empty-state">Select a complaint to review its detail view.</div>
              )}
            </article>
          </div>
        </>
      )}

      {adminTab === 'surveys' && (
        <>
          {error ? <div className="notice error">{error}</div> : null}

          <div className="admin-layout">
            <aside className="list-panel">
              <button
                className="primary-button"
                style={{ marginBottom: '12px', width: '100%', borderRadius: '12px', padding: '10px' }}
                onClick={() => {
                  setIsCreatingSurvey(true);
                  setSurveyDetail(null);
                }}
              >
                + Create New Survey
              </button>
              {busy && surveys.length === 0 ? <div className="empty-state">Loading surveys...</div> : null}
              {surveys.map((survey) => (
                <button
                  key={survey.id}
                  type="button"
                  className={`complaint-card ${survey.id === selectedSurveyId && !isCreatingSurvey ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedSurveyId(survey.id);
                    setIsCreatingSurvey(false);
                  }}
                  style={{ width: '100%', display: 'block' }}
                >
                  <div className="card-topline">
                    <strong style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }}>{survey.title}</strong>
                    <span className="status-badge tone-neutral" style={{ minWidth: 'auto', padding: '0.2rem 0.6rem', fontSize: '0.7rem' }}>
                      {survey.responseCount} / {survey.invitationCount} Responded
                    </span>
                  </div>
                  <p style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: '4px 0' }}>{survey.description || 'No description provided.'}</p>
                  <div className="card-meta">
                    <span>{new Date(survey.createdAt).toLocaleString()}</span>
                  </div>
                </button>
              ))}

              {!busy && surveys.length === 0 ? <div className="empty-state">No surveys created yet.</div> : null}
            </aside>

            <article className="detail-panel">
              {isCreatingSurvey ? (
                <form className="stack" onSubmit={handleCreateSurvey}>
                  <div className="detail-header" style={{ marginBottom: '16px' }}>
                    <div>
                      <div className="panel-label">New Feature</div>
                      <h3>Create Survey Form</h3>
                    </div>
                  </div>

                  <label className="field">
                    <span>Survey Title</span>
                    <input
                      value={newSurveyTitle}
                      onChange={(e) => setNewSurveyTitle(e.target.value)}
                      placeholder="e.g. Spring Boot Training Feedback"
                      required
                    />
                  </label>

                  <label className="field">
                    <span>Description</span>
                    <textarea
                      value={newSurveyDescription}
                      onChange={(e) => setNewSurveyDescription(e.target.value)}
                      placeholder="e.g. Tell us your honest thoughts. Submissions are 100% anonymous."
                      rows={3}
                      style={{ minHeight: '80px' }}
                    />
                  </label>

                  <div className="field">
                    <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Questions</span>
                      <button
                        type="button"
                        className="ghost-button"
                        style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '0.85rem' }}
                        onClick={() => setNewSurveyQuestions([...newSurveyQuestions, { text: '', type: 'DESCRIPTIVE', optionsString: '' }])}
                      >
                        + Add Question
                      </button>
                    </span>
                    <div className="stack" style={{ gap: '14px', marginTop: '6px' }}>
                      {newSurveyQuestions.map((question, qIdx) => (
                        <div key={qIdx} className="note-item" style={{ display: 'grid', gap: '10px', background: 'rgba(255, 255, 255, 0.01)', padding: '16px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                              value={question.text}
                              onChange={(e) => {
                                const updated = [...newSurveyQuestions];
                                updated[qIdx].text = e.target.value;
                                setNewSurveyQuestions(updated);
                              }}
                              placeholder={`Question #${qIdx + 1} Prompt`}
                              required
                              style={{ flex: 2 }}
                            />
                            <select
                              value={question.type}
                              onChange={(e) => {
                                const updated = [...newSurveyQuestions];
                                updated[qIdx].type = e.target.value;
                                setNewSurveyQuestions(updated);
                              }}
                              style={{ flex: 1, minWidth: '150px' }}
                            > 
                              <option value="DESCRIPTIVE">Descriptive</option>
                              <option value="NUMBER">Number Only</option>
                              <option value="SINGLE_CHOICE">Single Choice</option>
                              <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                            </select>
                            {newSurveyQuestions.length > 1 && (
                              <button
                                type="button"
                                className="ghost-button"
                                style={{ border: '1px solid var(--danger)', color: '#ffcbcb', background: 'rgba(255, 125, 125, 0.08)' }}
                                onClick={() => {
                                  setNewSurveyQuestions(newSurveyQuestions.filter((_, idx) => idx !== qIdx));
                                }}
                              >
                                Remove
                              </button>
                            )}
                          </div>

                          {(question.type === 'SINGLE_CHOICE' || question.type === 'MULTIPLE_CHOICE') && (
                            <label className="field">
                              <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Choices (comma-separated, e.g. Yes, No, Maybe)</span>
                              <input
                                value={question.optionsString}
                                onChange={(e) => {
                                  const updated = [...newSurveyQuestions];
                                  updated[qIdx].optionsString = e.target.value;
                                  setNewSurveyQuestions(updated);
                                }}
                                placeholder="Choice 1, Choice 2, Choice 3"
                                required
                              />
                            </label>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <label className="field">
                    <span>Target Recipients (Emails)</span>
                    <textarea
                      value={newSurveyEmails}
                      onChange={(e) => setNewSurveyEmails(e.target.value)}
                      placeholder="Enter emails separated by commas or new lines (e.g. user1@example.com, user2@example.com)"
                      rows={4}
                      style={{ minHeight: '100px' }}
                      required
                    />
                  </label>

                  <div className="row-between" style={{ marginTop: '16px' }}>
                    <button className="primary-button" type="submit" disabled={busy}>
                      Create & Send Invitations
                    </button>
                    <button
                      className="ghost-button"
                      type="button"
                      onClick={() => {
                        setIsCreatingSurvey(false);
                        if (surveys.length > 0) {
                          setSelectedSurveyId(surveys[0].id);
                        }
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : surveyDetail ? (
                <>
                  <div className="detail-header" style={{ borderBottom: '1px solid var(--panel-border)', paddingBottom: '16px', marginBottom: '16px' }}>
                    <div>
                      <div className="panel-label">Survey Detail</div>
                      <h3>{surveyDetail.title}</h3>
                      <p className="muted" style={{ margin: '4px 0 0 0', fontSize: '0.9rem' }}>
                        Created on {new Date(surveyDetail.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <p className="detail-content" style={{ margin: '0 0 20px 0' }}>{surveyDetail.description || 'No description provided.'}</p>

                  <div style={{ marginBottom: '24px' }}>
                    <span className="helper">Questions List</span>
                    <ol style={{ paddingLeft: '20px', margin: '8px 0 0 0', color: 'var(--text)' }}>
                      {surveyDetail.questions.map((q, idx) => (
                        <li key={idx} style={{ marginBottom: '8px' }}>
                          <strong>{q.text}</strong>{' '}
                          <span className="helper" style={{ fontSize: '0.8rem', textTransform: 'lowercase' }}>
                            ({q.type.replace('_', ' ')})
                          </span>
                          {(q.type === 'SINGLE_CHOICE' || q.type === 'MULTIPLE_CHOICE') && (
                            <div className="muted" style={{ fontSize: '0.85rem', marginTop: '2px' }}>
                              Choices: {q.options.join(', ')}
                            </div>
                          )}
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--panel-border)', paddingBottom: '12px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="ghost-button"
                        style={{
                          borderRadius: '8px',
                          background: surveySubTab === 'responses' ? 'rgba(214, 163, 72, 0.12)' : 'transparent',
                          borderColor: surveySubTab === 'responses' ? 'var(--accent)' : 'var(--panel-border)',
                          color: surveySubTab === 'responses' ? 'var(--accent-strong)' : 'var(--muted)',
                          padding: '6px 12px',
                          fontSize: '0.9rem'
                        }}
                        onClick={() => setSurveySubTab('responses')}
                      >
                        Responses ({surveyDetail.responses.length})
                      </button>
                      <button
                        className="ghost-button"
                        style={{
                          borderRadius: '8px',
                          background: surveySubTab === 'invitations' ? 'rgba(214, 163, 72, 0.12)' : 'transparent',
                          borderColor: surveySubTab === 'invitations' ? 'var(--accent)' : 'var(--panel-border)',
                          color: surveySubTab === 'invitations' ? 'var(--accent-strong)' : 'var(--muted)',
                          padding: '6px 12px',
                          fontSize: '0.9rem'
                        }}
                        onClick={() => setSurveySubTab('invitations')}
                      >
                        Invitations ({surveyDetail.tokens.length})
                      </button>
                    </div>

                    {surveyDetail.responses.length > 0 && (
                      <button
                        className="secondary-button"
                        style={{
                          borderRadius: '8px',
                          padding: '6px 12px',
                          fontSize: '0.9rem',
                          borderColor: 'rgba(123, 211, 137, 0.35)',
                          background: 'rgba(123, 211, 137, 0.1)',
                          cursor: 'pointer'
                        }}
                        onClick={exportResponsesToCSV}
                      >
                        📊 Export to Excel
                      </button>
                    )}
                  </div>

                  {surveySubTab === 'responses' ? (
                    <div className="stack" style={{ gap: '16px', maxHeight: '500px', overflowY: 'auto', paddingRight: '8px' }}>
                      {surveyDetail.responses.length === 0 ? (
                        <div className="empty-state">No feedback submitted yet. Invitees can submit their responses anonymously using their unique links.</div>
                      ) : (
                        surveyDetail.responses.map((response, rIdx) => (
                          <div key={response.id} className="note-item" style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                            <div className="card-topline" style={{ marginBottom: '10px' }}>
                              <strong style={{ color: 'var(--accent-strong)' }}>Response #{surveyDetail.responses.length - rIdx}</strong>
                              <span className="helper" style={{ fontSize: '0.8rem' }}>
                                Submitted: {new Date(response.submittedAt).toLocaleString()}
                              </span>
                            </div>
                            <div className="stack" style={{ gap: '10px' }}>
                              {surveyDetail.questions.map((q, qIdx) => (
                                <div key={qIdx} style={{ borderLeft: '2px solid var(--accent)', paddingLeft: '10px', fontSize: '0.95rem' }}>
                                  <div className="helper" style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                                    Q: {q.text} <span style={{ fontSize: '0.75rem', fontWeight: 'normal' }}>({q.type.toLowerCase()})</span>
                                  </div>
                                  <div style={{ marginTop: '2px', color: 'var(--text)', whiteSpace: 'pre-wrap' }}>
                                    {response.answers[qIdx] || <em className="muted">No answer provided</em>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  ) : (
                    <div className="stack" style={{ gap: '12px', maxHeight: '500px', overflowY: 'auto', paddingRight: '8px' }}>
                      <form className="stack" onSubmit={handleAddInvitations} style={{ background: 'rgba(255, 255, 255, 0.01)', padding: '16px', borderRadius: '16px', border: '1px solid var(--panel-border)', marginBottom: '12px' }}>
                        <label className="field">
                          <span style={{ fontWeight: 'bold' }}>Add More Invitations</span>
                          <textarea
                            value={addEmails}
                            onChange={(e) => setAddEmails(e.target.value)}
                            placeholder="Enter recipient emails separated by commas or new lines..."
                            rows={2}
                            style={{ minHeight: '60px' }}
                            required
                            disabled={addingInvites}
                          />
                        </label>
                        <button className="secondary-button" type="submit" disabled={addingInvites || !addEmails.trim()} style={{ width: 'fit-content' }}>
                          {addingInvites ? 'Adding...' : 'Add Recipients'}
                        </button>
                      </form>

                      {surveyDetail.tokens.map((token) => (
                        <div key={token.id} className="note-item" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '14px' }}>
                          <div className="row-between" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                            <strong>{token.email}</strong>
                            <span
                              className="status-badge"
                              style={{
                                padding: '2px 8px',
                                fontSize: '0.75rem',
                                minWidth: 'auto',
                                background: token.used ? 'rgba(123, 211, 137, 0.12)' : 'rgba(241, 179, 91, 0.12)',
                                color: token.used ? '#a9e7b1' : '#f6cc87',
                                borderColor: token.used ? 'rgba(123, 211, 137, 0.25)' : 'rgba(241, 179, 91, 0.26)'
                              }}
                            >
                              {token.used ? 'Completed' : 'Pending'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px', width: '100%' }}>
                            <input
                              readOnly
                              value={token.invitationLink}
                              style={{ padding: '6px 10px', borderRadius: '8px', fontSize: '0.85rem', background: 'rgba(0, 0, 0, 0.2)', border: '1px solid var(--panel-border)', cursor: 'text', flex: 1 }}
                              onClick={(e) => e.target.select()}
                            />
                            <button
                              type="button"
                              className="ghost-button"
                              style={{ padding: '6px 12px', fontSize: '0.85rem', borderRadius: '8px', whiteSpace: 'nowrap' }}
                              onClick={() => {
                                void navigator.clipboard.writeText(token.invitationLink);
                                alert('Link copied to clipboard!');
                              }}
                            >
                              Copy Link
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="empty-state">Select a survey to view its responses and invitations.</div>
              )}
            </article>
          </div>
        </>
      )}
    </section>
  );
}