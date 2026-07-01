import { Copy, RefreshCw, Brain, GitBranch, FileText } from 'lucide-react'

interface MessageContextMenuProps {
  open: boolean
  x: number
  y: number
  onClose: () => void
  onCopy: () => void
  onRegenerate: () => void
  onDeepAnalysis: () => void
  onDivergentAnalysis: () => void
  onViewSources: () => void
}

export function MessageContextMenu({
  open, x, y, onClose,
  onCopy, onRegenerate, onDeepAnalysis, onDivergentAnalysis, onViewSources,
}: MessageContextMenuProps) {
  if (!open) return null

  const items = [
    { icon: Copy, label: '复制', action: onCopy },
    { icon: RefreshCw, label: '重新生成', action: onRegenerate },
    { icon: Brain, label: '深度分析', action: onDeepAnalysis },
    { icon: GitBranch, label: '发散分析', action: onDivergentAnalysis },
    { icon: FileText, label: '查看来源', action: onViewSources },
  ]

  return (
    <>
      <div className="fixed inset-0 z-50" onClick={onClose} />
      <div
        className="fixed z-50 py-1 bg-surface rounded-xl shadow-xl border border-ink-muted/10 min-w-[140px]"
        style={{
          left: Math.min(x, window.innerWidth - 160),
          top: Math.min(y, window.innerHeight - 220),
        }}
      >
        {items.map(({ icon: Icon, label, action }) => (
          <button
            key={label}
            onClick={() => { action(); onClose() }}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-left text-sm text-ink-secondary hover:bg-canvas-warm"
          >
            <Icon size={16} className="text-ink-tertiary" />
            {label}
          </button>
        ))}
      </div>
    </>
  )
}
