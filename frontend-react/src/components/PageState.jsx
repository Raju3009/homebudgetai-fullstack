export function PageLoading({ label = 'Loading…' }) {
  return <div className="panel full page-status" role="status"><span className="status-spinner" />{label}</div>;
}

export function PageError({ message, onRetry }) {
  return (
    <div className="panel full page-status error-state" role="alert">
      <strong>We could not load this data.</strong>
      <p>{message}</p>
      {onRetry && <button className="btn-secondary" type="button" onClick={onRetry}>Try again</button>}
    </div>
  );
}

export function EmptyState({ children }) {
  return <div className="empty-state">{children}</div>;
}
