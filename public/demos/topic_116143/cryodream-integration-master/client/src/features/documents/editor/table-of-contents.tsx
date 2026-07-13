import { useMemo } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { List } from 'lucide-react'

export interface TocItem {
  id: string
  level: number
  text: string
}

interface TableOfContentsProps {
  markdown: string
  activeId?: string
  onHeadingClick?: (id: string) => void
}

const HEADING_RE = /^[ \t]*(#{2,6})\s+(.+?)[ \t]*$/gm

function extractHeadings(markdown: string): TocItem[] {
  const headings: TocItem[] = []
  let match: RegExpExecArray | null
  HEADING_RE.lastIndex = 0
  while ((match = HEADING_RE.exec(markdown)) !== null) {
    const level = match[1].length
    const text = match[2].trim()
    const id = text
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fff]+/g, '-')
      .replace(/^-+|-+$/g, '')
    headings.push({ id, level, text })
  }
  return headings
}

const levelStyles: Record<number, { fontSize: string; opacity: string; weight: string }> = {
  2: { fontSize: '12px', opacity: '1', weight: 'font-medium' },
  3: { fontSize: '11px', opacity: '0.85', weight: 'font-normal' },
  4: { fontSize: '10.5px', opacity: '0.7', weight: 'font-normal' },
  5: { fontSize: '10px', opacity: '0.6', weight: 'font-normal' },
  6: { fontSize: '10px', opacity: '0.5', weight: 'font-normal' },
}

export function TableOfContents({ markdown, activeId, onHeadingClick }: TableOfContentsProps) {
  const headings = useMemo(() => extractHeadings(markdown), [markdown])

  if (headings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/40">
        <List className="size-5 mb-1.5" />
        <p className="text-[10px]">暂无标题</p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <nav className="py-1">
        {headings.map((h, idx) => {
          const isActive = activeId === h.id
          const style = levelStyles[h.level] || levelStyles[6]
          const indent = (h.level - 2) * 14
          return (
            <button
              key={`${h.id}-${idx}`}
              type="button"
              className={`block w-full truncate rounded-sm py-1 pr-2 text-left leading-snug transition-colors ${
                isActive
                  ? 'bg-accent text-accent-foreground font-medium'
                  : `text-muted-foreground hover:bg-accent/50 hover:text-foreground ${style.weight}`
              }`}
              style={{
                paddingLeft: `${10 + indent}px`,
                fontSize: style.fontSize,
                opacity: isActive ? 1 : undefined,
              }}
              onClick={() => onHeadingClick?.(h.id)}
              title={h.text}
            >
              {h.text}
            </button>
          )
        })}
      </nav>
    </ScrollArea>
  )
}
