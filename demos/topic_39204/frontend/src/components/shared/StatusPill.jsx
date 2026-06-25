export function StatusPill({ tone, children }) {
  return <span className={`status-pill ${tone || ""}`.trim()}>{children}</span>;
}
