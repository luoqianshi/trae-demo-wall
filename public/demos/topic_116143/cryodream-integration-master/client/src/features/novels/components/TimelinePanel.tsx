import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  Bookmark,
  Clock,
  Pencil,
  Plus,
  Trash2,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import {
  novelSnapshotApi,
  novelTimelineApi,
  parseAttributes,
  type NovelCharacterItem,
  type NovelCharacterSnapshot,
  type NovelOutlineNode,
  type NovelTimelineEvent,
} from '../api/novel-api'
import { flattenOutline } from '../stores/novel-workspace-store'
import { AttributeEditor } from './AttributeEditor'

interface Props {
  novelId: string
  events: NovelTimelineEvent[]
  characters: NovelCharacterItem[]
  outlineTree: NovelOutlineNode[]
  activeEventId: string | null
  onActiveChange: (id: string | null) => void
  onChange: () => void
}

const IMPORTANCE_LEVELS = [
  { value: 1, label: '普通', color: 'bg-muted-foreground/40' },
  { value: 2, label: '重要', color: 'bg-sky-500' },
  { value: 3, label: '关键', color: 'bg-amber-500' },
  { value: 4, label: '高潮', color: 'bg-rose-500' },
  { value: 5, label: '结局级', color: 'bg-primary' },
]

const emptyForm = {
  title: '',
  description: '',
  timeLabel: '',
  chapterId: '__none__',
  characterIds: [] as string[],
  importance: 1,
}

export function TimelinePanel({
  novelId,
  events,
  characters,
  outlineTree,
  activeEventId,
  onActiveChange,
  onChange,
}: Props) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<NovelTimelineEvent | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [snapshots, setSnapshots] = useState<NovelCharacterSnapshot[]>([])

  const chapters = useMemo(() => {
    return flattenOutline(outlineTree).filter((n) => n.level === 3)
  }, [outlineTree])

  const characterMap = useMemo(() => {
    const map: Record<string, NovelCharacterItem> = {}
    characters.forEach((c) => (map[c.id] = c))
    return map
  }, [characters])

  const active = events.find((e) => e.id === activeEventId) ?? null

  useEffect(() => {
    if (!activeEventId && events.length > 0) {
      onActiveChange(events[0]!.id)
    } else if (activeEventId && !events.find((e) => e.id === activeEventId)) {
      onActiveChange(events[0]?.id ?? null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events])

  useEffect(() => {
    if (active?.id) {
      novelSnapshotApi
        .listByEvent(active.id)
        .then(setSnapshots)
        .catch(() => setSnapshots([]))
    } else {
      setSnapshots([])
    }
  }, [active?.id])

  const openCreate = () => {
    setEditing(null)
    setForm({ ...emptyForm })
    setDialogOpen(true)
  }

  const openEdit = (ev: NovelTimelineEvent) => {
    setEditing(ev)
    setForm({
      title: ev.title,
      description: ev.description ?? '',
      timeLabel: ev.timeLabel ?? '',
      chapterId: ev.chapterId ?? '__none__',
      characterIds: (ev.characterIds ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      importance: ev.importance ?? 1,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error('事件标题不能为空')
      return
    }
    setSubmitting(true)
    try {
      const id = await novelTimelineApi.save({
        id: editing?.id,
        novelId,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        timeLabel: form.timeLabel.trim() || undefined,
        chapterId: form.chapterId === '__none__' ? null : form.chapterId,
        characterIds: form.characterIds.join(','),
        importance: form.importance,
      })
      toast.success('已保存')
      setDialogOpen(false)
      onChange()
      if (!editing) onActiveChange(id)
    } catch (e) {
      toast.error((e as Error).message || '保存失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (ev: NovelTimelineEvent) => {
    if (!confirm(`删除事件「${ev.title}」？关联的人物快照将解除关联。`)) return
    try {
      await novelTimelineApi.delete(ev.id)
      toast.success('已删除')
      if (activeEventId === ev.id) onActiveChange(null)
      onChange()
    } catch (e) {
      toast.error((e as Error).message || '删除失败')
    }
  }

  const moveEvent = async (idx: number, dir: -1 | 1) => {
    const target = idx + dir
    if (target < 0 || target >= events.length) return
    const items = [...events]
    const a = items[idx]!
    const b = items[target]!
    try {
      await novelTimelineApi.reorder(novelId, [
        { id: a.id, sortOrder: b.sortOrder ?? target },
        { id: b.id, sortOrder: a.sortOrder ?? idx },
      ])
      onChange()
    } catch (e) {
      toast.error((e as Error).message || '调整顺序失败')
    }
  }

  const toggleCharacter = (id: string) => {
    setForm((prev) => ({
      ...prev,
      characterIds: prev.characterIds.includes(id)
        ? prev.characterIds.filter((x) => x !== id)
        : [...prev.characterIds, id],
    }))
  }

  return (
    <div className="flex h-full min-h-[500px] gap-4 rounded-xl border bg-card p-1">
      {/* 左：事件时间轴 */}
      <div className="flex w-80 shrink-0 flex-col gap-2 rounded-lg border-e bg-muted/10 p-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Timeline
          </span>
          <Button size="sm" variant="ghost" className="h-6 gap-1 px-2 text-[11px]" onClick={openCreate}>
            <Plus className="size-3" />
            新事件
          </Button>
        </div>
        <ScrollArea className="flex-1">
          {events.length === 0 ? (
            <div className="rounded-md border border-dashed p-6 text-center">
              <p className="text-xs text-muted-foreground">还没有剧情事件</p>
              <Button size="sm" variant="outline" className="mt-2 h-7" onClick={openCreate}>
                <Plus data-icon="inline-start" />
                添加第一个事件
              </Button>
            </div>
          ) : (
            <div className="relative flex flex-col gap-2 py-2 pe-1">
              {/* 时间轴主线 */}
              <span
                className="absolute inset-y-2 start-[19px] w-px bg-gradient-to-b from-primary/30 via-border to-transparent"
                aria-hidden
              />
              {events.map((ev, idx) => {
                const importance = IMPORTANCE_LEVELS.find((l) => l.value === (ev.importance ?? 1))
                const isActive = activeEventId === ev.id
                return (
                  <button
                    key={ev.id}
                    onClick={() => onActiveChange(ev.id)}
                    className={cn(
                      'group relative flex w-full items-start gap-3 rounded-md px-2 py-2 text-left transition-colors',
                      isActive ? 'bg-primary/10' : 'hover:bg-muted/50'
                    )}
                  >
                    {/* 时间轴节点 */}
                    <div className="relative flex size-9 shrink-0 items-center justify-center">
                      <span
                        className={cn(
                          'size-3 rounded-full ring-4 ring-background transition-transform',
                          importance?.color ?? 'bg-muted-foreground/40',
                          isActive && 'scale-125'
                        )}
                      />
                    </div>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <div className="flex items-center gap-1.5">
                        {ev.timeLabel && (
                          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                            {ev.timeLabel}
                          </span>
                        )}
                        <span className="truncate text-sm font-medium">{ev.title}</span>
                      </div>
                      {ev.description && (
                        <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
                          {ev.description}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-5"
                        onClick={(e) => {
                          e.stopPropagation()
                          void moveEvent(idx, -1)
                        }}
                        disabled={idx === 0}
                      >
                        <ArrowUp className="size-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-5"
                        onClick={(e) => {
                          e.stopPropagation()
                          void moveEvent(idx, 1)
                        }}
                        disabled={idx === events.length - 1}
                      >
                        <ArrowDown className="size-3" />
                      </Button>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* 右：事件详情 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {!active ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <div className="flex size-14 items-center justify-center rounded-full border border-dashed bg-muted/30">
              <Clock className="size-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">选择或创建一个事件</p>
            <p className="max-w-xs text-xs text-muted-foreground">
              用时间线记录剧情推进，把人物属性快照与关键事件绑在一起。
            </p>
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <div className="flex flex-col gap-6 p-6 lg:p-8">
              {/* 顶部 */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'size-2.5 rounded-full',
                        IMPORTANCE_LEVELS.find((l) => l.value === (active.importance ?? 1))?.color
                      )}
                    />
                    {active.timeLabel && (
                      <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                        {active.timeLabel}
                      </span>
                    )}
                    <Badge variant="secondary" className="font-normal">
                      {IMPORTANCE_LEVELS.find((l) => l.value === (active.importance ?? 1))?.label}
                    </Badge>
                  </div>
                  <h2 className="text-2xl font-semibold tracking-tight">{active.title}</h2>
                  {active.description && (
                    <p className="max-w-2xl whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                      {active.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-8" onClick={() => openEdit(active)}>
                    <Pencil data-icon="inline-start" />
                    编辑
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(active)}
                  >
                    <Trash2 data-icon="inline-start" />
                    删除
                  </Button>
                </div>
              </div>

              {/* 关联章节 */}
              {active.chapterId && (
                <section className="flex items-center gap-2 rounded-md border bg-muted/20 p-3 text-sm">
                  <Bookmark className="size-4 shrink-0 text-primary" />
                  <span className="text-muted-foreground">关联章节：</span>
                  <span className="font-medium">
                    {chapters.find((c) => c.id === active.chapterId)?.title ?? '（已删除）'}
                  </span>
                </section>
              )}

              {/* 涉及人物 */}
              {active.characterIds && active.characterIds.length > 0 && (
                <section className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Users className="size-4 text-primary" />
                    <h3 className="text-base font-semibold tracking-tight">涉及人物</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {active.characterIds
                      .split(',')
                      .filter(Boolean)
                      .map((id) => characterMap[id])
                      .filter(Boolean)
                      .map((c) => (
                        <div
                          key={c!.id}
                          className="flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs"
                        >
                          <span className="size-1.5 rounded-full bg-primary" />
                          <span className="font-medium">{c!.name}</span>
                          {c!.identity && (
                            <span className="text-muted-foreground">· {c!.identity}</span>
                          )}
                        </div>
                      ))}
                  </div>
                </section>
              )}

              {/* 快照 */}
              <section className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-primary" />
                  <h3 className="text-base font-semibold tracking-tight">此刻人物状态</h3>
                  <span className="text-[11px] text-muted-foreground">
                    · 关联到本事件的属性快照
                  </span>
                </div>
                {snapshots.length === 0 ? (
                  <div className="rounded-md border border-dashed p-6 text-center">
                    <p className="text-sm text-muted-foreground">尚未关联任何人物快照</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      在「人物」标签中新建快照并选择此事件即可关联
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {snapshots.map((s) => (
                      <article
                        key={s.id}
                        className="flex flex-col gap-2 rounded-lg border bg-card p-4"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">
                            {characterMap[s.characterId]?.name ?? '未知人物'}
                          </span>
                          <Badge variant="outline" className="font-normal">
                            {s.label}
                          </Badge>
                        </div>
                        {s.note && (
                          <p className="text-xs text-muted-foreground">{s.note}</p>
                        )}
                        <AttributeEditor
                          value={parseAttributes(s.attributes)}
                          onChange={() => {}}
                          readOnly
                          compact
                        />
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </ScrollArea>
        )}
      </div>

      {/* 事件编辑弹窗 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-auto">
          <DialogHeader>
            <DialogTitle>{editing ? '编辑事件' : '新建剧情事件'}</DialogTitle>
            <DialogDescription>
              事件用于串起剧情推进节点，可关联章节和人物。
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-5 py-2">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 flex flex-col gap-2">
                <Label>事件标题 *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="例如：主角初入宗门 / 双方决裂"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>时间标签</Label>
                <Input
                  value={form.timeLabel}
                  onChange={(e) => setForm({ ...form, timeLabel: e.target.value })}
                  placeholder="T1 / 三年后"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label>关联章节</Label>
                <Select
                  value={form.chapterId}
                  onValueChange={(v) => setForm({ ...form, chapterId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="可选" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="__none__">— 不关联 —</SelectItem>
                      {chapters.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.title}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>重要程度</Label>
                <Select
                  value={String(form.importance)}
                  onValueChange={(v) => setForm({ ...form, importance: Number(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {IMPORTANCE_LEVELS.map((l) => (
                        <SelectItem key={l.value} value={String(l.value)}>
                          <span className="flex items-center gap-2">
                            <span className={cn('size-2 rounded-full', l.color)} />
                            {l.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label>描述</Label>
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="发生了什么、影响是什么……"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>涉及人物</Label>
              {characters.length === 0 ? (
                <p className="text-xs italic text-muted-foreground">还没有人物，先去「人物」标签添加</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {characters.map((c) => {
                    const on = form.characterIds.includes(c.id)
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleCharacter(c.id)}
                        className={cn(
                          'rounded-full border px-3 py-1 text-xs transition-colors',
                          on
                            ? 'border-primary bg-primary/10 font-medium'
                            : 'text-muted-foreground hover:border-foreground/40'
                        )}
                      >
                        {c.name}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={submitting}>
              {submitting ? '保存中…' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
