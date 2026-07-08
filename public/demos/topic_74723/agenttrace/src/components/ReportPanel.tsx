import type { ReviewReport } from '../types';
import { IssueList } from './IssueList';
import { getScoreLevel } from '../utils/cost';

interface ReportPanelProps {
  report: ReviewReport | null;
}

function StatusEmpty() {
  return (
    <div className="empty-state">
      <div className="empty-icon">🔍</div>
      <h3>等待生成复盘</h3>
      <p>填写项目信息，粘贴 AI 工作记录，然后点击"生成复盘"按钮</p>
      <div className="hint">
        <span>💡</span>
        <span>点击"载入示例"可以快速体验完整功能</span>
      </div>
    </div>
  );
}

function ScoreCircle({ score }: { score: number }) {
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const scoreInfo = getScoreLevel(score);

  return (
    <div className="metric-card score-card">
      <div className="score-circle">
        <svg width="72" height="72" viewBox="0 0 80 80">
          <circle className="score-circle-bg" cx="40" cy="40" r={radius} />
          <circle
            className="score-circle-progress"
            cx="40"
            cy="40"
            r={radius}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ stroke: scoreInfo.color }}
          />
        </svg>
        <div className="score-circle-text" style={{ color: scoreInfo.color }}>{score}</div>
      </div>
      <div className="metric-label">模型评分</div>
      <div className="metric-sublabel" style={{ color: scoreInfo.color }}>{scoreInfo.level}</div>
    </div>
  );
}

function MetricCard({ label, value, sublabel, color }: { label: string; value: string | number; sublabel?: string; color?: string }) {
  return (
    <div className="metric-card">
      <div className="metric-value" style={{ color }}>{value}</div>
      <div className="metric-label">{label}</div>
      {sublabel && <div className="metric-sublabel">{sublabel}</div>}
    </div>
  );
}

function TokenProgressBar({ report }: { report: ReviewReport }) {
  const { costMetrics } = report;
  const total = costMetrics.totalTokens || 1;
  
  return (
    <div className="card">
      <h3 className="card-title">📊 Token 分布</h3>
      <div className="progress-bar-container">
        <div className="progress-item">
          <div className="progress-label">
            <span>输入 Tokens</span>
            <span>{((total - costMetrics.outputRatio * total - costMetrics.cacheRatio * total) / total * 100).toFixed(1)}%</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${((total - costMetrics.outputRatio * total - costMetrics.cacheRatio * total) / total * 100)}%` }}
            />
          </div>
        </div>
        <div className="progress-item">
          <div className="progress-label">
            <span>输出 Tokens</span>
            <span>{(costMetrics.outputRatio * 100).toFixed(1)}%</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill output"
              style={{ width: `${costMetrics.outputRatio * 100}%` }}
            />
          </div>
        </div>
        <div className="progress-item">
          <div className="progress-label">
            <span>缓存命中</span>
            <span>{(costMetrics.cacheRatio * 100).toFixed(1)}%</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill cache"
              style={{ width: `${costMetrics.cacheRatio * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ReportPanel({ report }: ReportPanelProps) {
  if (!report) {
    return <StatusEmpty />;
  }

  const scoreInfo = getScoreLevel(report.modelScore);

  return (
    <div className="report-panel">
      {/* Score & Metrics */}
      <div className="metrics-grid">
        <ScoreCircle score={report.modelScore} />
        <MetricCard
          label="总 Tokens"
          value={report.costMetrics.totalTokens.toLocaleString()}
        />
        <MetricCard
          label="问题数量"
          value={report.issues.length}
          color={report.issues.length > 0 ? '#c4a77d' : '#7c9885'}
        />
        <MetricCard
          label="修改文件"
          value={report.modifiedFiles.length}
        />
      </div>

      {/* Token Distribution */}
      {report.costMetrics.totalTokens > 0 && <TokenProgressBar report={report} />}

      {/* Summary */}
      <div className="card">
        <h3 className="card-title">📝 阶段总结</h3>
        <pre className="report-text">{report.summary}</pre>
      </div>

      {/* Completed Items */}
      <div className="card">
        <h3 className="card-title">✅ 完成内容</h3>
        <ul className="report-list">
          {report.completedItems.length > 0 ? (
            report.completedItems.map((item, i) => <li key={i}>{item}</li>)
          ) : (
            <li className="text-muted">未识别到完成项</li>
          )}
        </ul>
      </div>

      {/* Key Actions */}
      <div className="card">
        <h3 className="card-title">🔑 关键操作</h3>
        <ul className="report-list">
          {report.keyActions.length > 0 ? (
            report.keyActions.slice(0, 10).map((action, i) => <li key={i}>{action}</li>)
          ) : (
            <li className="text-muted">未识别到关键操作</li>
          )}
        </ul>
      </div>

      {/* Modified Files */}
      <div className="card">
        <h3 className="card-title">📁 修改文件</h3>
        {report.modifiedFiles.length > 0 ? (
          <div className="files-list">
            {report.modifiedFiles.map((file, i) => (
              <span key={i} className="file-tag">{file}</span>
            ))}
          </div>
        ) : (
          <p className="text-muted">未识别到文件变更</p>
        )}
      </div>

      {/* Issues */}
      <div className="card">
        <h3 className="card-title">⚠️ 遇到的问题</h3>
        <IssueList issues={report.issues} />
      </div>

      {/* Cost Analysis */}
      <div className="card">
        <h3 className="card-title">💸 成本与效率</h3>
        <pre className="report-text">{report.costAnalysis}</pre>
      </div>

      {/* Model Evaluation */}
      <div className="card">
        <h3 className="card-title">🤖 模型表现评价</h3>
        <pre className="report-text">{report.modelEvaluation}</pre>
      </div>

      {/* Next Suggestions */}
      <div className="card">
        <h3 className="card-title">💡 下次提示词建议</h3>
        <ul className="report-list suggestion-list">
          {report.nextPromptSuggestions.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
