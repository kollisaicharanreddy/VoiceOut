import React, { useEffect, useState } from 'react';
import { verifySurveyToken, submitSurveyFeedback } from '../api';

export default function SurveyForm({ token, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [survey, setSurvey] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('No invitation token found in the link.');
      setLoading(false);
      return;
    }

    async function loadSurvey() {
      try {
        const response = await verifySurveyToken(token);
        if (response.valid) {
          setSurvey(response);
          setAnswers(new Array(response.questions.length).fill(''));
        } else {
          setError('This invitation link is invalid or has already been used.');
        }
      } catch (err) {
        setError(err.message || 'Failed to verify invitation link.');
      } finally {
        setLoading(false);
      }
    }

    void loadSurvey();
  }, [token]);

  const handleAnswerChange = (index, value) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (answers.some(ans => !ans || !ans.trim())) {
      setError('Please answer all questions before submitting.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      await submitSurveyFeedback(token, answers.map(a => a.trim()));
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Failed to submit feedback.');
    } finally {
      setBusy(false);
    }
  };

  const renderQuestionInput = (question, index) => {
    const value = answers[index] || '';

    switch (question.type) {
      case 'NUMBER':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleAnswerChange(index, e.target.value)}
            placeholder="Enter a number..."
            required
            disabled={busy}
          />
        );
      case 'SINGLE_CHOICE':
        return (
          <select
            value={value}
            onChange={(e) => handleAnswerChange(index, e.target.value)}
            required
            disabled={busy}
          >
            <option value="">-- Select an option --</option>
            {question.options.map((opt, oIdx) => (
              <option key={oIdx} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );
      case 'MULTIPLE_CHOICE':
        const selected = value ? value.split(',').map(s => s.trim()) : [];
        const handleCheckboxChange = (optText, checked) => {
          let nextSelected;
          if (checked) {
            nextSelected = [...selected.filter(s => s !== ''), optText];
          } else {
            nextSelected = selected.filter(s => s !== optText);
          }
          handleAnswerChange(index, nextSelected.join(', '));
        };

        return (
          <div className="stack" style={{ gap: '8px', padding: '12px', background: 'rgba(255, 255, 255, 0.01)', borderRadius: '16px', border: '1px solid var(--panel-border)' }}>
            {question.options.map((opt, oIdx) => (
              <label key={oIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={selected.includes(opt)}
                  onChange={(e) => handleCheckboxChange(opt, e.target.checked)}
                  disabled={busy}
                  style={{ width: 'auto', margin: 0 }}
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        );
      case 'DESCRIPTIVE':
      default:
        return (
          <textarea
            value={value}
            onChange={(e) => handleAnswerChange(index, e.target.value)}
            placeholder="Provide your honest feedback here..."
            rows={4}
            required
            disabled={busy}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-card" style={{ textAlign: 'center' }}>
          <div className="panel-label">Verifying Token</div>
          <h2>Securing your session...</h2>
          <p className="muted">Retrieving survey configuration from server.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="modal-overlay">
        <div className="modal-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', color: 'var(--success)', marginBottom: '16px' }}>✓</div>
          <h2>Feedback Submitted Anonymously</h2>
          <p className="muted" style={{ marginBottom: '24px' }}>
            Thank you for your response! Your token has been marked as used and your answers have been recorded.
          </p>
          <div className="notice" style={{ background: 'rgba(123, 211, 137, 0.08)', borderColor: 'rgba(123, 211, 137, 0.2)', marginBottom: '24px', textAlign: 'left' }}>
            <strong>🔒 Cryptographically Disassociated</strong>:
            <div style={{ fontSize: '0.9rem', color: 'var(--muted)', marginTop: '4px' }}>
              Your answers have been stored in a decoupled database table containing no reference keys to your invitation token or email. HR cannot associate your responses with your identity.
            </div>
          </div>
          <button className="primary-button" style={{ width: '100%' }} onClick={onClose}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (error && !survey) {
    return (
      <div className="modal-overlay">
        <div className="modal-card">
          <div className="panel-label" style={{ color: 'var(--danger)' }}>Access Denied</div>
          <h2>Invalid Invitation</h2>
          <p className="muted" style={{ marginBottom: '24px' }}>{error}</p>
          <button className="primary-button" style={{ width: '100%' }} onClick={onClose}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="panel" style={{ maxWidth: '680px', margin: '0 auto', backdropFilter: 'blur(16px)' }}>
      <div className="panel-label">Anonymous Survey</div>
      <h2>{survey.surveyTitle}</h2>
      {survey.surveyDescription && (
        <p className="muted" style={{ fontSize: '1.05rem', margin: '8px 0 24px 0' }}>
          {survey.surveyDescription}
        </p>
      )}

      {error && <div className="notice error" style={{ marginBottom: '20px' }}>{error}</div>}

      <form className="stack" onSubmit={handleSubmit} style={{ gap: '20px' }}>
        {survey.questions.map((question, index) => (
          <div key={index} className="field">
            <span style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--text)' }}>
              {index + 1}. {question.text}
              <span className="helper" style={{ fontSize: '0.8rem', marginLeft: '6px', fontWeight: 'normal', textTransform: 'lowercase' }}>
                ({question.type.replace('_', ' ')})
              </span>
            </span>
            {renderQuestionInput(question, index)}
          </div>
        ))}

        <div className="notice" style={{ background: 'rgba(214, 163, 72, 0.05)', borderColor: 'rgba(214, 163, 72, 0.15)', fontSize: '0.9rem' }}>
          <strong>🔒 100% Anonymous Feedback Guaranteed</strong>
          <p style={{ margin: '4px 0 0 0', color: 'var(--muted)' }}>
            This application uses a <strong>Transactional Split</strong> backend mechanism. 
            Your answers are stored completely decoupled from your token, making it mathematically impossible for HR or system administrators to reverse-engineer who wrote this feedback.
          </p>
        </div>

        <div className="row-between" style={{ marginTop: '12px' }}>
          <button className="primary-button" type="submit" disabled={busy || answers.some(a => !a || !a.trim())}>
            {busy ? 'Submitting...' : 'Submit Feedback Anonymously'}
          </button>
          <button className="ghost-button" type="button" onClick={onClose} disabled={busy}>
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
