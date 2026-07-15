import { useMemo } from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { useAppStore } from '../store/appStore'

interface ReportViewProps {
  embedded?: boolean
}

export default function ReportView({ embedded = false }: ReportViewProps) {
  const { report, saveDashboard, agentRunning } = useAppStore()

  if (!report) {
    return null
  }

  const markdown = useMemo(() => {
    const parts = report.sections.map(
      (s) => `## ${s.heading}\n\n${s.content}`
    )
    return `# ${report.title}\n\n${parts.join('\n\n')}`
  }, [report])

  const html = useMemo(() => {
    const raw = marked(markdown, { async: false }) as string
    return DOMPurify.sanitize(raw)
  }, [markdown])

  return (
    <div className="report-view">
      {!embedded && <div className="panel-title">分析报告</div>}
      <div
        className="report-content"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <div className="report-actions">
        <button
          className="save-dashboard-btn"
          onClick={saveDashboard}
          disabled={agentRunning}
        >
          保存到看板
        </button>
      </div>
    </div>
  )
}
