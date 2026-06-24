import { useEffect, useState } from "react";

export function SubtitleOverlay({
  pipelineState,
  connectionState,
  embedded = false,
  draftSubtitle = null,
  subtitles = [],
  defaultDisplayMode = "targetOnly",
  defaultHighContrast = false,
}) {
  const [displayMode, setDisplayMode] = useState(defaultDisplayMode);
  const [highContrast, setHighContrast] = useState(defaultHighContrast);

  const currentSentenceLabel =
    draftSubtitle?.sentenceIndex !== undefined
      ? Number(draftSubtitle.sentenceIndex) + 1
      : draftSubtitle?.sentenceId || "--";

  const formatClock = (timestamp) =>
    timestamp
      ? new Intl.DateTimeFormat("zh-CN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }).format(new Date(timestamp))
      : "";

  let latestFinalText = "";
  for (const message of subtitles) {
    if (message.finalText) {
      latestFinalText = message.finalText;
    }
  }

  useEffect(() => {
    if (!embedded) {
      document.documentElement.dataset.theme = highContrast ? "high-contrast" : "";
    }
  }, [embedded, highContrast]);

  return (
    <section className={`subtitle-frame ${embedded ? "embedded" : "floating"}`}>
      <div className="overlay-controls">
        <button
          type="button"
          className={`mini-toggle ${displayMode === "bilingual" ? "active" : ""}`}
          onClick={() => setDisplayMode("bilingual")}
        >
          双语
        </button>
        <button
          type="button"
          className={`mini-toggle ${displayMode === "targetOnly" ? "active" : ""}`}
          onClick={() => setDisplayMode("targetOnly")}
        >
          仅译文
        </button>
        <button
          type="button"
          className={`mini-toggle ${highContrast ? "active" : ""}`}
          onClick={() => setHighContrast((value) => !value)}
        >
          高对比
        </button>
      </div>

      <div className="subtitle-meta">
        <span>管道 {pipelineState}</span>
        <span>链路 {connectionState}</span>
      </div>

      {displayMode === "bilingual" ? (
        <div className="translation-focus">
          <p className="focus-label">当前句草稿</p>
          {draftSubtitle ? (
            <article className="translation-active draft-active">
              <p>{draftSubtitle.draftText || draftSubtitle.displayText || draftSubtitle.text}</p>
              <small>
                句子 {currentSentenceLabel} · 当前句修订 {Number(draftSubtitle.revision ?? 1)}
              </small>
              <small>{formatClock(draftSubtitle.timestamp)}</small>
            </article>
          ) : (
            <article className="translation-active idle">
              <p>等待新的草稿字幕...</p>
              <small>当前句形成可读内容后，这里会先显示可回改的草稿</small>
            </article>
          )}
        </div>
      ) : (
        <div className="translation-focus target-only">
          <p className="focus-label">当前定稿</p>
          <article className="translation-active final-active">
            <p>{latestFinalText || "等待定稿..."}</p>
          </article>
        </div>
      )}

      <div className="subtitle-stack">
        {subtitles.length ? (
          subtitles
            .filter((message) => (displayMode === "targetOnly" ? message.finalText : true))
            .map((message) => (
              <article
                key={`${message.sentenceId ?? message.timestamp}-${message.text}`}
                className={`subtitle-line ${message.finalText ? "final" : "draft"}`}
              >
                <p>{message.finalText || message.draftText || message.displayText || message.text}</p>
                <small>
                  {message.finalText ? "已定稿" : "修订中"} · 句子{" "}
                  {message.sentenceIndex !== undefined
                    ? Number(message.sentenceIndex) + 1
                    : message.sentenceId || "--"}
                </small>
                <small>
                  修订 {message.revisionCount || message.revision || 1} ·{" "}
                  {formatClock(message.lastUpdatedAt || message.timestamp)}
                </small>
                {message.highVolatility ? <small>需确认 · 建议确认后引用</small> : null}
                {message.history?.length ? (
                  <div className="revision-track">
                    {message.history.map((entry) => (
                      <span
                        key={`${entry.kind}-${entry.revision}-${entry.timestamp}`}
                        className={`revision-chip ${entry.kind}`}
                      >
                        {entry.kind === "final" ? `F${entry.revision}` : `D${entry.revision}`}
                      </span>
                    ))}
                  </div>
                ) : null}
              </article>
            ))
        ) : (
          <article className="subtitle-line empty">
            <p>等待翻译结果...</p>
            <small>这里会保留最近完成并可能被修正过的字幕</small>
          </article>
        )}
      </div>
    </section>
  );
}
