import { useState } from 'react';
import { createComplaint } from '../api';
import StatusBadge from '../components/StatusBadge';

export default function Submit({ onSubmitted }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await createComplaint(content);
      setResult(response);
      setContent('');
      onSubmitted?.(response.trackingCode);
    } catch (submissionError) {
      setError(submissionError.message || 'Unable to submit complaint');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel spotlight">
      <div className="panel-label">Anonymous intake</div>
      <h2>Submit a complaint without creating an account.</h2>
      <p className="muted">
        VoiceOut stores the report text and a tracking code only. Keep the code if you want to revisit the case later.
      </p>

      <form className="stack" onSubmit={handleSubmit}>
        <label className="field">
          <span>Complaint details</span>
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Describe what happened, who was involved, and any time-sensitive details."
            minLength={10}
            maxLength={4000}
            required
          />
        </label>

        <div className="row-between">
          <span className="helper">Minimum 10 characters. Maximum 4,000.</span>
          <span className="helper">{content.length} / 4000</span>
        </div>

        {error ? <div className="notice error">{error}</div> : null}

        <button className="primary-button" type="submit" disabled={loading || content.trim().length < 10}>
          {loading ? 'Submitting...' : 'Send complaint'}
        </button>
      </form>

      {result ? (
        <div className="result-card">
          <div className="result-header">
            <strong>Complaint received</strong>
            <StatusBadge value={result.status} />
          </div>
          <p className="tracking-code">{result.trackingCode}</p>
          <p className="muted">{result.message}</p>
        </div>
      ) : null}
    </section>
  );
}