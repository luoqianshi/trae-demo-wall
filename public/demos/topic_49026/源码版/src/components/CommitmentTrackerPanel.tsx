import { useEffect, useMemo, useState } from 'react'
import { Check, X, CalendarDays, CheckSquare } from 'lucide-react'
import { useDataStore } from '../stores/useDataStore'
import { dataSyncService } from '../services/dataSyncService'
import { workplaceService, type CommitmentItem } from '../services/workplaceService'

type CommitmentFilter = 'all' | 'made-by-me' | 'made-to-me'

const filters: { key: CommitmentFilter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'made-by-me', label: '我承诺的' },
  { key: 'made-to-me', label: '别人承诺我的' },
]

export function CommitmentTrackerPanel() {
  const persons = useDataStore((s) => s.persons)
  const loadMemories = useDataStore((s) => s.loadMemories)

  const [filter, setFilter] = useState<CommitmentFilter>('all')
  const [items, setItems] = useState<CommitmentItem[]>([])
  const [loading, setLoading] = useState(false)
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())

  const loadCommitments = async () => {
    setLoading(true)
    try {
      const result = await workplaceService.getCommitments(
        filter === 'all' ? undefined : filter
      )
      setItems(result)
    } catch (e) {
      console.error('[CommitmentTrackerPanel] loadCommitments failed:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCommitments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  const personMap = useMemo(() => {
    const map = new Map<string, string>()
    persons.forEach((p) => map.set(p.id, p.name))
    return map
  }, [persons])

  const getPersonName = (item: CommitmentItem): string => {
    return personMap.get(item.who) ?? item.who ?? '未知'
  }

  const handleComplete = async (item: CommitmentItem) => {
    if (processingIds.has(item.id)) return
    setProcessingIds((prev) => new Set(prev).add(item.id))
    try {
      const nextTags = Array.from(new Set([...item.tags, 'done']))
      await dataSyncService.updateMemory(item.memoryId, { tags: nextTags })
      await loadMemories()
      await loadCommitments()
    } catch (e) {
      console.error('[CommitmentTrackerPanel] complete failed:', e)
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev)
        next.delete(item.id)
        return next
      })
    }
  }

  const handleDelete = async (item: CommitmentItem) => {
    if (processingIds.has(item.id)) return
    setProcessingIds((prev) => new Set(prev).add(item.id))
    try {
      await dataSyncService.deleteMemory(item.memoryId)
      await loadMemories()
      await loadCommitments()
    } catch (e) {
      console.error('[CommitmentTrackerPanel] delete failed:', e)
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev)
        next.delete(item.id)
        return next
      })
    }
  }

  const isDone = (item: CommitmentItem) => item.tags.includes('done')

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-canvas rounded-lg p-1">
        {filters.map((f) => {
          const active = filter === f.key
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-colors ${
                active
                  ? 'bg-surface text-ink-primary shadow-sm'
                  : 'text-ink-tertiary hover:text-ink-secondary hover:bg-canvas-warm'
              }`}
            >
              {f.label}
            </button>
          )
        })}
      </div>

      {loading && items.length === 0 && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-surface border border-ink-muted/10 rounded-xl p-4 space-y-2"
            >
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-ink-muted/20 animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-full rounded bg-ink-muted/20 animate-pulse" />
                  <div className="h-3 w-2/3 rounded bg-ink-muted/20 animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-surface border border-ink-muted/10 rounded-xl">
          <div className="w-12 h-12 rounded-full bg-zen-sage/10 flex items-center justify-center mb-3">
            <CheckSquare className="w-6 h-6 text-zen-sage" />
          </div>
          <p className="text-sm text-ink-secondary">暂无承诺记录</p>
          <p className="text-2xs text-ink-tertiary mt-1 max-w-xs">
            在对话或日记中记录承诺，这里会自动汇总并追踪
          </p>
        </div>
      )}

      <div className="space-y-3">
        {items.map((item) => {
          const done = isDone(item)
          const personName = getPersonName(item)
          const directionLabel =
            item.direction === 'made-by-me'
              ? `我承诺给 ${personName}`
              : `${personName} 承诺给我`

          return (
            <div
              key={item.id}
              className={`flex items-start gap-3 bg-surface border border-ink-muted/10 rounded-xl p-3 transition-opacity ${
                done ? 'opacity-60' : ''
              }`}
            >
              <button
                type="button"
                onClick={() => handleComplete(item)}
                disabled={processingIds.has(item.id) || done}
                className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border transition-colors ${
                  done
                    ? 'bg-zen-sage border-zen-sage text-white'
                    : 'border-ink-muted hover:border-zen-sage hover:bg-zen-sage/10 text-ink-tertiary'
                } disabled:cursor-not-allowed`}
                aria-label="标记完成"
              >
                {done && <Check className="w-3.5 h-3.5" />}
              </button>

              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm text-ink-primary leading-relaxed ${
                    done ? 'line-through text-ink-tertiary' : ''
                  }`}
                >
                  {item.content}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-2xs text-ink-tertiary">
                  <span className="px-1.5 py-0.5 rounded bg-canvas-warm text-ink-secondary">
                    {directionLabel}
                  </span>
                  {item.deadline && (
                    <span className="flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" />
                      {item.deadline}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleDelete(item)}
                disabled={processingIds.has(item.id)}
                className="mt-0.5 p-1 rounded-md text-ink-tertiary hover:text-zen-rose hover:bg-zen-rose/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="忽略"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
