export function EmptyState({ title, description }) {
  return (
    <div className="empty-state">
      <p>{title}</p>
      {description ? <small>{description}</small> : null}
    </div>
  );
}
