import { GlossaryChips } from "../shared/GlossaryChips.jsx";

export function ExportTab({
  archivedSessions,
  exportDigestSource,
  exportFormat,
  exportFormats,
  exportRange,
  exportRanges,
  exportSessionLabel,
  exportSource,
  exportSourceLabel,
  exportTimelineSource,
  formatClock,
  onArchiveChange,
  onExport,
  onExportFormatChange,
  onExportRangeChange,
  onExportSourceChange,
  onTodoNavigate,
  selectedArchiveId,
}) {
  const selectedFormat = exportFormats.find((item) => item.id === exportFormat);

  return (
    <section className="panel export-panel">
      <div className="panel-head">
        <div>
          <p className="panel-kicker">导出</p>
          <h2>保存字幕与摘要</h2>
        </div>
      </div>

      <div className="export-grid refined">
        <div className="select-stack">
          <label className="text-field slim">
            <span>导出来源</span>
            <select value={exportSource} onChange={(event) => onExportSourceChange(event.target.value)}>
              <option value="current">当前会话</option>
              <option value="archive" disabled={!archivedSessions.length}>
                历史归档
              </option>
            </select>
          </label>

          {exportSource === "archive" ? (
            <label className="text-field slim">
              <span>归档会话</span>
              <select value={selectedArchiveId} onChange={(event) => onArchiveChange(event.target.value)}>
                {archivedSessions.length ? (
                  archivedSessions.map((archive) => (
                    <option key={archive.id} value={archive.id}>
                      {archive.sceneTemplateName} · {archive.pairLabel} · {formatClock(archive.createdAt)}
                    </option>
                  ))
                ) : (
                  <option value="">暂无归档会话</option>
                )}
              </select>
            </label>
          ) : null}

          <div className="export-select-row">
            <label className="text-field slim">
              <span>导出格式</span>
              <select value={exportFormat} onChange={(event) => onExportFormatChange(event.target.value)}>
                {exportFormats.map((format) => (
                  <option key={format.id} value={format.id}>
                    {format.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-field slim">
              <span>导出范围</span>
              <select value={exportRange} onChange={(event) => onExportRangeChange(event.target.value)}>
                {exportRanges.map((range) => (
                  <option key={range.id} value={range.id}>
                    {range.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="export-brief">
          <strong>{selectedFormat?.name}</strong>
          <span>{exportTimelineSource.length} 句 · {exportSourceLabel}</span>
          <small>{exportSessionLabel}</small>
        </div>
      </div>

      <div className="digest-grid export-digest-grid">
        <article className="digest-card export-digest-card">
          <div>
            <span>会后智能整理</span>
            <strong>自动摘要</strong>
            {(exportDigestSource.summary || []).slice(0, 1).map((item, index) => (
              <p key={`summary-${index}`}>{item}</p>
            ))}
          </div>
          <div>
            <span>重点词</span>
            {(exportDigestSource.topics || []).length ? (
              <GlossaryChips
                variant="correction"
                items={(exportDigestSource.topics || []).slice(0, 6).map((item) => ({
                  key: `topic-${item}`,
                  label: item,
                }))}
              />
            ) : (
              <small>当前暂无聚合出的主题词。</small>
            )}
          </div>
        </article>
        <article className="digest-card export-todo-card">
          <div className="export-todo-content">
            <div>
              <span>复核待办</span>
              <strong>{exportDigestSource.reviewCount || (exportDigestSource.todo || []).length} 项</strong>
            </div>
            <div className="export-todo-list">
              {(exportDigestSource.todo || []).slice(0, 1).map((item, index) => (
                <button
                  key={`todo-${index}`}
                  type="button"
                  className="todo-link"
                  onClick={() => onTodoNavigate(item)}
                >
                  {item}
                </button>
              ))}
              {(exportDigestSource.todo || []).length > 1 ? (
                <small>另有 {(exportDigestSource.todo || []).length - 1} 项可在回看中查看</small>
              ) : null}
            </div>
          </div>
          <div className="export-button-rail">
            <button type="button" className="primary-button export-inline-button" onClick={onExport}>
              导出当前结果
            </button>
          </div>
        </article>
      </div>
    </section>
  );
}
