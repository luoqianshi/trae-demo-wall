import { useMemo } from 'react'
import { Hash } from 'lucide-react'
import { cn } from '@/lib/utils'
import { extractHeadings } from '../lib/text-utils'

interface Props {
  markdown: string
  onJump?: (line: number) => void
}

/**
 * 章节内目录 —— 提取 H1~H6，用于长章节导航
 */
export function ChapterTOC({ markdown, onJump }: Props) {
  const headings = useMemo(() => extractHeadings(markdown), [markdown])

  if (headings.length === 0) {
    return (
      <div className="flex flex-col gap-2 p-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-muted-foreground">
          Chapter TOC
        </p>
        <div className="rounded-md border border-dashed p-4 text-center">
          <p className="text-xs text-muted-foreground">
            当前章节内没有小标题
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            使用 <code className="rounded bg-muted px-1">##</code> 或{' '}
            <code className="rounded bg-muted px-1">###</code> 添加小标题
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5 p-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-muted-foreground">
        Chapter TOC · {headings.length}
      </p>
      <div className="flex flex-col gap-0.5">
        {headings.map((h) => (
          <button
            key={`${h.line}-${h.id}`}
            onClick={() => onJump?.(h.line)}
            className={cn(
              'group flex items-start gap-1.5 rounded px-2 py-1 text-start text-[13px] transition-colors hover:bg-muted/60'
            )}
            style={{ paddingInlineStart: `${(h.level - 1) * 10 + 8}px` }}
          >
            <Hash
              className={cn(
                'mt-1 size-3 shrink-0 text-muted-foreground/50 group-hover:text-primary',
                h.level === 1 && 'text-primary/80'
              )}
            />
            <span
              className={cn(
                'truncate',
                h.level === 1 && 'font-semibold',
                h.level === 2 && 'font-medium',
                h.level >= 3 && 'text-muted-foreground'
              )}
            >
              {h.text}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
