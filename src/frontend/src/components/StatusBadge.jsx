const STATUS_TONE = {
  NEW: 'tone-new',
  IN_REVIEW: 'tone-review',
  RESOLVED: 'tone-resolved',
  REJECTED: 'tone-rejected',
  PENDING: 'tone-pending',
  DONE: 'tone-done',
  FAILED: 'tone-failed'
};

export default function StatusBadge({ value }) {
  return <span className={`status-badge ${STATUS_TONE[value] || 'tone-neutral'}`}>{value}</span>;
}