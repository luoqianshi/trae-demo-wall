export function GlossaryChips({ items, variant = "" }) {
  if (!items?.length) {
    return null;
  }

  return (
    <div className="glossary-chips">
      {items.map((item) => {
        const value = typeof item === "string" ? item : item.label;
        const key = typeof item === "string" ? item : item.key || item.label;
        return (
          <span key={key} className={`glossary-chip ${variant}`.trim()}>
            {value}
          </span>
        );
      })}
    </div>
  );
}
