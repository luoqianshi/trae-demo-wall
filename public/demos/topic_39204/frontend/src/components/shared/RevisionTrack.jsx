export function RevisionTrack({ history, formatTimestamp, renderLabel }) {
  if (!history?.length) {
    return null;
  }

  return (
    <div className="revision-track">
      {history.map((entry) => (
        <span
          key={`${entry.kind}-${entry.revision}-${entry.timestamp}`}
          className={`revision-chip ${entry.kind}`}
          title={`${formatTimestamp(entry.timestamp)} ${entry.text}`}
        >
          {renderLabel(entry)}
        </span>
      ))}
    </div>
  );
}
