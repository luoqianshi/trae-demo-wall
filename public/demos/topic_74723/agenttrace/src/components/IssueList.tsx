import type { ParsedIssue, Severity } from '../types';

interface IssueListProps {
  issues: ParsedIssue[];
}

function getSeverityStyle(severity: Severity) {
  switch (severity) {
    case 'high':
      return { bg: 'rgba(193, 127, 114, 0.12)', border: '#c17f72', badge: '#c17f72' };
    case 'medium':
      return { bg: 'rgba(196, 167, 125, 0.12)', border: '#c4a77d', badge: '#b8956a' };
    case 'low':
      return { bg: 'rgba(124, 152, 133, 0.12)', border: '#7c9885', badge: '#7c9885' };
    default:
      return { bg: 'rgba(154, 146, 136, 0.1)', border: '#9a9288', badge: '#9a9288' };
  }
}

function getSeverityLabel(severity: Severity): string {
  const map: Record<Severity, string> = {
    high: '高危',
    medium: '中等',
    low: '轻微',
  };
  return map[severity];
}

export function IssueList({ issues }: IssueListProps) {
  if (issues.length === 0) {
    return (
      <div className="empty-state" style={{ padding: '2rem', border: 'none', background: 'rgba(124, 152, 133, 0.06)' }}>
        <p style={{ color: '#7c9885', margin: 0 }}>✅ 未检测到问题，任务执行顺利</p>
      </div>
    );
  }

  return (
    <div className="issues-list">
      {issues.map((issue, index) => {
        const style = getSeverityStyle(issue.severity);
        return (
          <div
            key={index}
            className="issue-card"
            style={{ backgroundColor: style.bg, borderLeftColor: style.border }}
          >
            <div className="issue-header">
              <h4>{issue.title}</h4>
              <span
                className="severity-badge"
                style={{ backgroundColor: style.badge }}
              >
                {getSeverityLabel(issue.severity)}
              </span>
            </div>
            <div className="issue-content">
              <p className="issue-evidence">
                <strong>证据：</strong>{issue.evidence}
              </p>
              <p><strong>可能原因：</strong>{issue.possibleCause}</p>
              <p><strong>解决方式：</strong>{issue.solution}</p>
              <p><strong>下次避免：</strong>{issue.prevention}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
