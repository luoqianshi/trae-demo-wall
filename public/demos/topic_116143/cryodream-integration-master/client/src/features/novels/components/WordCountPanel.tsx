import { useMemo } from 'react'
import { BookOpen, Clock, Hash, Layers, Sparkles, Type, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { computeWordStats } from '../lib/text-utils'
import type { NovelOutlineNode } from '../api/novel-api'

interface Props {
  currentContent: string
  currentNode: NovelOutlineNode | null
  outlineTree: NovelOutlineNode[]
  novelTotal: number
  todayNew: number
  dailyTarget?: number
  summary: string
  onGenerateSummary: () => void
  canGenerateSummary?: boolean
}

/** 递归求某节点及其子孙的字数（用于本章 / 本卷） */
function sumBranch(node: NovelOutlineNode | null | undefined): number {
  if (!node) return 0
  let total = node.wordCount ?? 0
  for (const child of node.children ?? []) {
    total += sumBranch(child)
  }
  return total
}

function findAncestor(
  tree: NovelOutlineNode[],
  id: string,
  ancestors: NovelOutlineNode[] = []
): NovelOutlineNode[] | null {
  for (const n of tree) {
    if (n.id === id) return ancestors
    const path = findAncestor(n.children ?? [], id, [...ancestors, n])
    if (path) return path
  }
  return null
}

export function WordCountPanel({
  currentContent,
  currentNode,
  outlineTree,
  novelTotal,
  todayNew,
  dailyTarget = 3000,
  summary,
  onGenerateSummary,
  canGenerateSummary = true,
}: Props) {
  const stats = useMemo(() => computeWordStats(currentContent), [currentContent])

  const { chapterTotal, volumeTotal } = useMemo(() => {
    if (!currentNode) return { chapterTotal: 0, volumeTotal: 0 }
    const ancestors = findAncestor(outlineTree, currentNode.id) ?? []
    // ancestors 例如 [卷, 章]，currentNode 是节
    const chapter = ancestors.find((n) => n.level === 2) ?? (currentNode.level === 2 ? currentNode : null)
    const volume = ancestors.find((n) => n.level === 1) ?? (currentNode.level === 1 ? currentNode : null)
    return {
      chapterTotal: sumBranch(chapter),
      volumeTotal: sumBranch(volume),
    }
  }, [currentNode, outlineTree])

  const targetPct = Math.min(100, Math.round((todayNew / Math.max(1, dailyTarget)) * 100))
  const trimmedSummary = summary?.trim() ?? ''

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* 概要块 —— 面板顶部 */}
      <div className="flex flex-col gap-2 rounded-lg border border-dashed border-border/70 bg-muted/10 p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-muted-foreground">
            Summary · 概要
          </p>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 gap-1 px-2 text-[11px]"
            onClick={onGenerateSummary}
            disabled={!canGenerateSummary}
            title="AI 生成本节概要"
          >
            <Sparkles className="size-3" />
            {trimmedSummary ? '重新生成' : 'AI 生成'}
          </Button>
        </div>
        <p
          className={cn(
            'text-[13px] leading-relaxed',
            trimmedSummary ? 'text-foreground/85' : 'italic text-muted-foreground'
          )}
        >
          {trimmedSummary || '尚未生成概要 · 点击右上「AI 生成」自动提炼本节剧情'}
        </p>
      </div>

      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-muted-foreground">
          Word Count
        </p>
        <p className="mt-1 text-xs text-muted-foreground">当前节的精细统计</p>
      </div>

      {/* 主数字：本节总字数 */}
      <div className="rounded-lg border bg-gradient-to-br from-muted/40 to-muted/10 p-4">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">本节字数</p>
        <p className="mt-1 font-mono text-3xl font-semibold tabular-nums tracking-tight">
          {stats.totalWords.toLocaleString()}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {stats.cjkChars.toLocaleString()} 汉字 · {stats.asciiWords.toLocaleString()} 英文词
        </p>
      </div>

      {/* 细分栏 */}
      <div className="grid grid-cols-2 gap-2">
        <StatCell icon={<Type className="size-3.5" />} label="字符" value={stats.charsWithoutSpaces} note="不含空格" />
        <StatCell icon={<Hash className="size-3.5" />} label="标点" value={stats.cjkPuncts} note="中文标点" />
        <StatCell icon={<Layers className="size-3.5" />} label="段落" value={stats.paragraphs} />
        <StatCell icon={<Clock className="size-3.5" />} label="预计阅读" value={stats.readingMinutes} note="分钟" />
      </div>

      {/* 累计 */}
      <div className="flex flex-col gap-1.5 rounded-lg border p-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          累计
        </p>
        <StackRow icon={<Layers className="size-3.5" />} label="本章合计" value={chapterTotal} />
        <StackRow icon={<Layers className="size-3.5" />} label="本卷合计" value={volumeTotal} />
        <StackRow icon={<BookOpen className="size-3.5" />} label="全书合计" value={novelTotal} highlight />
      </div>

      {/* 今日目标 */}
      <div className="flex flex-col gap-2 rounded-lg border p-3">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            <TrendingUp className="size-3" />
            今日目标
          </p>
          <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
            {todayNew.toLocaleString()} / {dailyTarget.toLocaleString()}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              targetPct >= 100 ? 'bg-emerald-500' : 'bg-primary'
            )}
            style={{ width: `${targetPct}%` }}
          />
        </div>
        <p className="text-[11px] text-muted-foreground">
          {targetPct >= 100
            ? '🎉 已达成今日目标！继续保持。'
            : `距离目标还差 ${(dailyTarget - todayNew).toLocaleString()} 字`}
        </p>
      </div>
    </div>
  )
}

function StatCell({
  icon,
  label,
  value,
  note,
}: {
  icon: React.ReactNode
  label: string
  value: number
  note?: string
}) {
  return (
    <div className="flex flex-col gap-0.5 rounded-md border bg-card px-2.5 py-2">
      <span className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="font-mono text-base font-medium tabular-nums">{value.toLocaleString()}</span>
      {note && <span className="text-[10px] text-muted-foreground">{note}</span>}
    </div>
  )
}

function StackRow({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode
  label: string
  value: number
  highlight?: boolean
}) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        {label}
      </span>
      <span
        className={cn(
          'font-mono tabular-nums',
          highlight ? 'text-base font-semibold text-foreground' : 'text-foreground/80'
        )}
      >
        {value.toLocaleString()}
      </span>
    </div>
  )
}
