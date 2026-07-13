import { useEffect, useMemo, useState } from 'react'
import {
  Camera,
  ClipboardList,
  Pencil,
  Plus,
  Search,
  Trash2,
  User,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import {
  novelCharacterApi,
  novelSnapshotApi,
  parseAttributes,
  stringifyAttributes,
  type CharacterAttribute,
  type NovelCharacterItem,
  type NovelCharacterSnapshot,
  type NovelTimelineEvent,
} from '../api/novel-api'
import { AttributeEditor } from './AttributeEditor'
import { CharacterFormDialog } from './CharacterFormDialog'
import { SnapshotDialog } from './SnapshotDialog'

interface Props {
  novelId: string
  characters: NovelCharacterItem[]
  events: NovelTimelineEvent[]
  activeCharacterId: string | null
  onActiveChange: (id: string | null) => void
  onChange: () => void
}

export function CharacterListPanel({
  novelId,
  characters,
  events,
  activeCharacterId,
  onActiveChange,
  onChange,
}: Props) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<NovelCharacterItem | null>(null)
  const [keyword, setKeyword] = useState('')

  const [snapshots, setSnapshots] = useState<NovelCharacterSnapshot[]>([])
  const [snapshotDialogOpen, setSnapshotDialogOpen] = useState(false)
  const [editingSnapshot, setEditingSnapshot] = useState<NovelCharacterSnapshot | null>(null)

  const filtered = useMemo(
    () =>
      characters.filter((c) => {
        if (!keyword.trim()) return true
        const k = keyword.trim().toLowerCase()
        return [c.name, c.alias, c.identity, c.personality].some((v) =>
          (v ?? '').toLowerCase().includes(k)
        )
      }),
    [characters, keyword]
  )

  const active = characters.find((c) => c.id === activeCharacterId) ?? null

  // 保持一个合法的 activeCharacterId：无选中时选中第一个
  useEffect(() => {
    if (!activeCharacterId && filtered.length > 0) {
      onActiveChange(filtered[0]!.id)
    } else if (activeCharacterId && !characters.find((c) => c.id === activeCharacterId)) {
      onActiveChange(filtered[0]?.id ?? null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characters, filtered.length])

  // 拉取快照
  const reloadSnapshots = async (characterId: string) => {
    try {
      const list = await novelSnapshotApi.listByCharacter(characterId)
      setSnapshots(list)
    } catch {
      toast.error('快照加载失败')
    }
  }

  useEffect(() => {
    if (active?.id) void reloadSnapshots(active.id)
    else setSnapshots([])
  }, [active?.id])

  const handleAdd = () => {
    setEditing(null)
    setDialogOpen(true)
  }

  const handleEdit = (c: NovelCharacterItem) => {
    setEditing(c)
    setDialogOpen(true)
  }

  const handleDelete = async (c: NovelCharacterItem) => {
    if (!confirm(`确定要删除人物「${c.name}」吗？相关的人物关系与快照也会被删除。`)) return
    try {
      await novelCharacterApi.delete(c.id)
      toast.success('已删除')
      if (activeCharacterId === c.id) onActiveChange(null)
      onChange()
    } catch (e) {
      toast.error((e as Error).message || '删除失败')
    }
  }

  const handleUpdateAttributes = async (next: CharacterAttribute[]) => {
    if (!active) return
    try {
      await novelCharacterApi.update({
        id: active.id,
        attributes: stringifyAttributes(next),
      })
      onChange()
    } catch (e) {
      toast.error((e as Error).message || '保存失败')
    }
  }

  const handleDeleteSnapshot = async (s: NovelCharacterSnapshot) => {
    if (!confirm(`删除快照「${s.label}」？`)) return
    try {
      await novelSnapshotApi.delete(s.id)
      toast.success('已删除快照')
      if (active) await reloadSnapshots(active.id)
    } catch (e) {
      toast.error((e as Error).message || '删除失败')
    }
  }

  const baseAttrs = parseAttributes(active?.attributes)

  return (
    <div className="flex h-full min-h-[500px] gap-4 rounded-xl border bg-card p-1">
      {/* 左：人物列表 */}
      <div className="flex w-64 shrink-0 flex-col gap-2 rounded-lg border-e bg-muted/10 p-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Characters
          </span>
          <Button size="sm" variant="ghost" className="h-6 gap-1 px-2 text-[11px]" onClick={handleAdd}>
            <Plus className="size-3" />
            新增
          </Button>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/70" />
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索人物"
            className="h-8 ps-8 text-xs"
          />
        </div>
        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-1 py-1 pe-1">
            {filtered.length === 0 ? (
              <div className="rounded-md border border-dashed p-4 text-center">
                <p className="text-[11px] text-muted-foreground">暂无人物</p>
              </div>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onActiveChange(c.id)}
                  className={cn(
                    'group relative flex items-center gap-2.5 rounded-md p-2 text-left transition-colors',
                    activeCharacterId === c.id
                      ? 'bg-primary/10'
                      : 'hover:bg-muted/50'
                  )}
                >
                  {activeCharacterId === c.id && (
                    <span className="absolute inset-y-2 start-0 w-0.5 rounded-full bg-primary" />
                  )}
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full border bg-gradient-to-br from-muted/60 to-muted/20">
                    <User className="size-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{c.name}</div>
                    <div className="truncate text-[11px] text-muted-foreground">
                      {c.identity || c.alias || '—'}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* 右：详情 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {!active ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <div className="flex size-14 items-center justify-center rounded-full border border-dashed bg-muted/30">
              <User className="size-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">选择或创建一位人物</p>
            <p className="max-w-xs text-xs text-muted-foreground">
              为每个人物建立完整档案，包含性格、背景与自定义状态属性。
            </p>
            <Button size="sm" onClick={handleAdd}>
              <Plus data-icon="inline-start" />
              新建人物
            </Button>
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <div className="flex flex-col gap-6 p-6 lg:p-8">
              {/* 人物头 */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex size-16 items-center justify-center rounded-full border bg-gradient-to-br from-muted/60 to-muted/20">
                    <User className="size-7 text-muted-foreground" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-semibold tracking-tight">{active.name}</h2>
                      {active.identity && (
                        <Badge variant="secondary" className="font-normal">
                          {active.identity}
                        </Badge>
                      )}
                    </div>
                    {active.alias && (
                      <p className="text-sm text-muted-foreground">「{active.alias}」</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-8" onClick={() => handleEdit(active)}>
                    <Pencil data-icon="inline-start" />
                    编辑档案
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

              {/* 概览 */}
              {(active.personality || active.background || active.appearance || active.catchphrase) && (
                <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {active.personality && (
                    <ProfileBlock label="性格">
                      <p className="text-sm leading-relaxed text-foreground/90">
                        {active.personality}
                      </p>
                    </ProfileBlock>
                  )}
                  {active.background && (
                    <ProfileBlock label="背景">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                        {active.background}
                      </p>
                    </ProfileBlock>
                  )}
                  {active.appearance && (
                    <ProfileBlock label="外貌">
                      <p className="text-sm leading-relaxed text-foreground/90">
                        {active.appearance}
                      </p>
                    </ProfileBlock>
                  )}
                  {active.catchphrase && (
                    <ProfileBlock label="口头禅">
                      <p className="border-s-2 border-primary/40 ps-3 text-sm italic leading-relaxed text-foreground/90">
                        「{active.catchphrase}」
                      </p>
                    </ProfileBlock>
                  )}
                </section>
              )}

              <Separator />

              {/* 自定义属性（当前值） */}
              <section className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="size-4 text-primary" />
                    <h3 className="text-base font-semibold tracking-tight">当前状态</h3>
                    <span className="text-[11px] text-muted-foreground">
                      · 自定义属性会随剧情推进保存快照
                    </span>
                  </div>
                </div>
                <AttributeEditor value={baseAttrs} onChange={handleUpdateAttributes} />
              </section>

              <Separator />

              {/* 状态快照 */}
              <section className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="size-4 text-primary" />
                    <h3 className="text-base font-semibold tracking-tight">状态快照</h3>
                    <span className="text-[11px] text-muted-foreground">
                      · 保存人物在不同剧情节点的属性值
                    </span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditingSnapshot(null)
                      setSnapshotDialogOpen(true)
                    }}
                  >
                    <Plus data-icon="inline-start" />
                    新建快照
                  </Button>
                </div>

                {snapshots.length === 0 ? (
                  <div className="rounded-md border border-dashed p-6 text-center">
                    <p className="text-sm text-muted-foreground">尚未记录任何状态快照</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      建议在关键剧情节点（如觉醒、突破、结局）为人物保存快照
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {snapshots.map((s) => {
                      const evt = s.eventId ? events.find((e) => e.id === s.eventId) : null
                      return (
                        <article
                          key={s.id}
                          className="group flex flex-col gap-2 rounded-lg border bg-card p-4 transition-shadow hover:shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h4 className="truncate text-sm font-semibold">{s.label}</h4>
                              {evt && (
                                <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                                  {evt.timeLabel ? `[${evt.timeLabel}] ` : ''}
                                  {evt.title}
                                </p>
                              )}
                            </div>
                            <div className="flex opacity-0 transition-opacity group-hover:opacity-100">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7"
                                onClick={() => {
                                  setEditingSnapshot(s)
                                  setSnapshotDialogOpen(true)
                                }}
                              >
                                <Pencil className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteSnapshot(s)}
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </div>
                          {s.note && (
                            <p className="line-clamp-2 text-xs text-muted-foreground">{s.note}</p>
                          )}
                          <AttributeEditor
                            value={parseAttributes(s.attributes)}
                            onChange={() => {}}
                            readOnly
                            compact
                          />
                        </article>
                      )
                    })}
                  </div>
                )}
              </section>
            </div>
          </ScrollArea>
        )}
      </div>

      <CharacterFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        novelId={novelId}
        editing={editing}
        onSaved={() => {
          onChange()
        }}
      />
      {active && (
        <SnapshotDialog
          open={snapshotDialogOpen}
          onOpenChange={setSnapshotDialogOpen}
          novelId={novelId}
          characterId={active.id}
          editing={editingSnapshot}
          events={events}
          baseAttributes={baseAttrs}
          onSaved={() => void reloadSnapshots(active.id)}
        />
      )}
    </div>
  )
}

function ProfileBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  )
}
