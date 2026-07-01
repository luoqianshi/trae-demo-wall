/**
 * 公共骨架屏组件
 * 用于列表页加载状态展示，提供统一视觉体验
 */

interface SkeletonCardProps {
  /** 骨架卡片数量 */
  count?: number
  /** 卡片变体：default（通用列表）、compact（紧凑列表）、wide（宽卡片） */
  variant?: 'default' | 'compact' | 'wide'
}

export function SkeletonList({ count = 3, variant = 'default' }: SkeletonCardProps) {
  const isCompact = variant === 'compact'
  const isWide = variant === 'wide'

  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-surface border border-ink-muted/10 rounded-xl p-4 space-y-2"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <div className="flex items-start gap-3">
            <div
              className={`rounded-full bg-ink-muted/20 animate-pulse flex-shrink-0 ${
                isCompact ? 'w-6 h-6' : 'w-8 h-8'
              }`}
            />
            <div className="flex-1 space-y-2">
              <div className={`rounded bg-ink-muted/20 animate-pulse ${isWide ? 'h-5 w-2/5' : 'h-4 w-1/3'}`} />
              <div className="h-3 w-full rounded bg-ink-muted/20 animate-pulse" />
              {!isCompact && <div className="h-3 w-2/3 rounded bg-ink-muted/20 animate-pulse" />}
              {isWide && <div className="h-3 w-1/2 rounded bg-ink-muted/20 animate-pulse" />}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/** 单行骨架（用于搜索结果、简短列表项） */
export function SkeletonRow({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-2"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="w-6 h-6 rounded-full bg-ink-muted/20 animate-pulse flex-shrink-0" />
          <div className="flex-1 space-y-1">
            <div className="h-3 w-1/4 rounded bg-ink-muted/20 animate-pulse" />
            <div className="h-2 w-1/2 rounded bg-ink-muted/20 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}
