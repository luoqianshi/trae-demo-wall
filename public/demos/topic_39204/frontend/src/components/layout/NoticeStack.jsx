export function NoticeStack({ notices }) {
  const visibleNotices = notices.filter((notice) => notice.message);

  if (!visibleNotices.length) {
    return null;
  }

  return (
    <section className="notice-stack" aria-live="polite">
      {visibleNotices.map((notice) => (
        <p key={notice.id} className={`notice ${notice.tone}`}>
          {notice.message}
        </p>
      ))}
    </section>
  );
}
