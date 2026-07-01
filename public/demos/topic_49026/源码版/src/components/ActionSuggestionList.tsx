import { Sparkles, CornerDownLeft } from 'lucide-react'

interface Suggestion {
  title: string
  description: string
}

interface ActionSuggestionListProps {
  suggestions: Suggestion[]
  loading?: boolean
  onApply?: (text: string) => void
  title?: string
  emptyHint?: string
}

export function ActionSuggestionList({
  suggestions,
  loading,
  onApply,
  title = '向上管理建议',
  emptyHint = '选择一位领导后可生成向上管理建议',
}: ActionSuggestionListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-medium text-ink-secondary mb-3">
          <Sparkles className="w-3.5 h-3.5 text-zen-terracotta" />
          正在生成建议...
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-surface border border-ink-muted/10 rounded-xl p-4 space-y-2">
            <div className="h-4 w-1/3 rounded bg-ink-muted/20 animate-pulse" />
            <div className="h-3 w-full rounded bg-ink-muted/20 animate-pulse" />
            <div className="h-3 w-2/3 rounded bg-ink-muted/20 animate-pulse" />
          </div>
        ))}
      </div>
    )
  }

  if (suggestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center bg-surface border border-ink-muted/10 rounded-xl">
        <Sparkles className="w-6 h-6 text-ink-muted mb-2" />
        <p className="text-sm text-ink-secondary">暂无建议</p>
        <p className="text-2xs text-ink-tertiary mt-1">{emptyHint}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5 text-xs font-medium text-ink-secondary">
        <Sparkles className="w-3.5 h-3.5 text-zen-terracotta" />
        {title}
      </div>

      {suggestions.map((suggestion, index) => (
        <div
          key={index}
          className="bg-surface border border-ink-muted/10 rounded-xl p-4 hover:shadow-sm transition-shadow"
        >
          <h5 className="text-sm font-medium text-ink-primary mb-1.5">{suggestion.title}</h5>
          <p className="text-xs text-ink-secondary leading-relaxed mb-3">{suggestion.description}</p>
          <button
            type="button"
            onClick={() => onApply?.(`${suggestion.title}：${suggestion.description}`)}
            className="inline-flex items-center gap-1 text-2xs px-2.5 py-1.5 rounded-md bg-zen-terracotta/10 text-zen-terracotta hover:bg-zen-terracotta/20 transition-colors"
          >
            <CornerDownLeft className="w-3 h-3" />
            应用到输入框
          </button>
        </div>
      ))}
    </div>
  )
}
