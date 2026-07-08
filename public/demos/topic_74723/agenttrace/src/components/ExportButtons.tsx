interface ExportButtonsProps {
  onExportProjectLog: () => void;
  onExportIssues: () => void;
  onExportJson: () => void;
  disabled: boolean;
}

export function ExportButtons({
  onExportProjectLog,
  onExportIssues,
  onExportJson,
  disabled,
}: ExportButtonsProps) {
  return (
    <div className="export-section">
      <h3 className="card-title">📥 导出报告</h3>
      <div className="export-buttons">
        <button
          className="btn btn-primary"
          onClick={onExportProjectLog}
          disabled={disabled}
        >
          📄 导出 project-log.md
        </button>
        <button
          className="btn btn-secondary"
          onClick={onExportIssues}
          disabled={disabled}
        >
          ❓ 导出 common-issues.md
        </button>
        <button
          className="btn btn-secondary"
          onClick={onExportJson}
          disabled={disabled}
        >
          📊 导出 session-summary.json
        </button>
      </div>
    </div>
  );
}
