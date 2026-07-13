import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { BookOpen, MoreHorizontal, Pencil, Plus, RefreshCw, Search, Sparkles, Trash2 } from 'lucide-react'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import { NOVEL_GENRE_OPTIONS, NOVEL_STATUS_OPTIONS } from './constants'
import { novelApi, type NovelItem } from './api/novel-api'

const emptyForm = { title: '', summary: '', genre: '', tags: '' }

const statusPalette: Record<string, string> = {
  writing: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  paused: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  finished: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
}

export function NovelListPage() {
  const navigate = useNavigate()
  const [novels, setNovels] = useState<NovelItem[]>([])
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState({ ...emptyForm })

  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState<{ id: string; title: string; summary: string; genre: string; tags: string }>(
    { id: '', ...emptyForm }
  )

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<NovelItem | null>(null)

  const filteredNovels = useMemo(() => {
    const text = keyword.trim().toLowerCase()
    if (!text) return novels
    return novels.filter((n) =>
      [n.title, n.summary, n.genre, n.tags].some((v) => (v ?? '').toLowerCase().includes(text))
    )
  }, [keyword, novels])

  const totalWords = useMemo(
    () => novels.reduce((sum, n) => sum + (n.wordCount ?? 0), 0),
    [novels]
  )

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const result = await novelApi.list({ current: 1, pageSize: 100 })
      setNovels(result.list)
    } catch {
      toast.error('小说列表加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const handleCreate = async () => {
    if (!createForm.title.trim()) {
      toast.error('小说标题不能为空')
      return
    }
    setSubmitting(true)
    try {
      const id = await novelApi.add({
        title: createForm.title.trim(),
        summary: createForm.summary.trim() || undefined,
        genre: createForm.genre || undefined,
        tags: createForm.tags.trim() || undefined,
      })
      toast.success('小说已创建')
      setCreateOpen(false)
      setCreateForm({ ...emptyForm })
      void reload()
      navigate({ to: '/novels/$novelId', params: { novelId: id }, search: { tab: 'outline' } })
    } catch (e) {
      toast.error((e as Error).message || '创建失败')
    } finally {
      setSubmitting(false)
    }
  }

  const openEdit = (novel: NovelItem) => {
    setEditForm({
      id: novel.id,
      title: novel.title,
      summary: novel.summary ?? '',
      genre: novel.genre ?? '',
      tags: novel.tags ?? '',
    })
    setEditOpen(true)
  }

  const handleEdit = async () => {
    if (!editForm.title.trim()) {
      toast.error('小说标题不能为空')
      return
    }
    setSubmitting(true)
    try {
      await novelApi.update({
        id: editForm.id,
        title: editForm.title.trim(),
        summary: editForm.summary.trim(),
        genre: editForm.genre || undefined,
        tags: editForm.tags.trim(),
      })
      toast.success('小说已更新')
      setEditOpen(false)
      void reload()
    } catch (e) {
      toast.error((e as Error).message || '更新失败')
    } finally {
      setSubmitting(false)
    }
  }

  const openDelete = (novel: NovelItem) => {
    setDeleteTarget(novel)
    setDeleteOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setSubmitting(true)
    try {
      await novelApi.delete(deleteTarget.id)
      toast.success('小说已删除')
      setDeleteOpen(false)
      setDeleteTarget(null)
      void reload()
    } catch (e) {
      toast.error((e as Error).message || '删除失败')
    } finally {
      setSubmitting(false)
    }
  }

  const statusMeta = (status?: string) => {
    const found = NOVEL_STATUS_OPTIONS.find((o) => o.value === status)
    return {
      label: found?.label ?? '连载中',
      palette: statusPalette[status ?? 'writing'] ?? statusPalette.writing,
    }
  }

  return (
    <>
      {/* 顶栏：仅 SidebarTrigger + 页面标题 */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-background/70 px-6 backdrop-blur">
        <SidebarTrigger className="-ms-2" />
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Novel Studio
          </span>
          <span className="text-muted-foreground/60">·</span>
          <span className="text-sm font-medium">小说创作</span>
        </div>
        <div className="ms-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={reload}
            disabled={loading}
            className="text-muted-foreground"
          >
            <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} data-icon="inline-start" />
            刷新
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-3.5" data-icon="inline-start" />
            新建
          </Button>
        </div>
      </header>

      {/* 主体 */}
      <ScrollArea className="flex-1">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-10 lg:px-10 lg:py-14">
          {/* Hero 标题区 */}
          <section className="flex flex-col gap-6 border-b pb-10">
            <div className="flex items-end justify-between gap-6">
              <div className="flex flex-col gap-3">
                <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
                  Your library
                </p>
                <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                  作品架
                  <span className="ms-3 align-middle text-2xl font-normal text-muted-foreground/60">
                    / 全部小说
                  </span>
                </h1>
                <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
                  在这里管理你的每一部作品。从大纲、章节到人物关系与世界观，用一个整洁的工作台完成整个创作流程。
                </p>
              </div>
              <div className="hidden shrink-0 items-center gap-8 lg:flex">
                <MetricStat label="作品数" value={novels.length.toString()} />
                <MetricStat label="累计字数" value={totalWords.toLocaleString()} />
                <MetricStat
                  label="连载中"
                  value={novels.filter((n) => (n.status ?? 'writing') === 'writing').length.toString()}
                />
              </div>
            </div>
          </section>

          {/* 搜索 */}
          <section className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/70" />
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="搜索作品名 / 简介 / 流派 / 标签"
                className="h-10 ps-10"
              />
            </div>
            <span className="text-xs text-muted-foreground">
              {filteredNovels.length} / {novels.length} 部
            </span>
          </section>

          {/* 列表 */}
          <section>
            {loading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-52 rounded-xl" />
                ))}
              </div>
            ) : filteredNovels.length === 0 ? (
              <EmptyState onCreate={() => setCreateOpen(true)} hasKeyword={keyword.length > 0} />
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredNovels.map((novel, idx) => {
                  const meta = statusMeta(novel.status)
                  return (
                    <article
                      key={novel.id}
                      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border bg-card transition-all hover:-translate-y-0.5 hover:shadow-lg"
                      onClick={() => navigate({ to: '/novels/$novelId', params: { novelId: novel.id }, search: { tab: 'outline' } })}
                    >
                      {/* 顶部编号带 */}
                      <div className="flex items-center justify-between border-b bg-muted/30 px-5 py-2.5">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                          Vol. {String(idx + 1).padStart(2, '0')}
                        </span>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium',
                              meta.palette
                            )}
                          >
                            <span className="size-1.5 rounded-full bg-current" />
                            {meta.label}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-1 flex-col gap-4 p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate text-lg font-semibold tracking-tight">{novel.title}</h3>
                            <p className="mt-1 line-clamp-2 min-h-[2.5em] text-sm leading-relaxed text-muted-foreground">
                              {novel.summary || '暂无简介。点击卡片进入工作台完善你的故事。'}
                            </p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                              >
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenuGroup>
                                <DropdownMenuItem onClick={() => openEdit(novel)}>
                                  <Pencil data-icon="inline-start" />
                                  编辑信息
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  variant="destructive"
                                  onClick={() => openDelete(novel)}
                                >
                                  <Trash2 data-icon="inline-start" />
                                  删除
                                </DropdownMenuItem>
                              </DropdownMenuGroup>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* 标签 */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          {novel.genre && (
                            <Badge variant="secondary" className="font-normal">
                              {novel.genre}
                            </Badge>
                          )}
                          {(novel.tags ?? '')
                            .split(/[,，、]/)
                            .map((t) => t.trim())
                            .filter(Boolean)
                            .slice(0, 3)
                            .map((tag) => (
                              <Badge key={tag} variant="outline" className="font-normal">
                                {tag}
                              </Badge>
                            ))}
                        </div>

                        {/* 底部信息 */}
                        <div className="mt-auto flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                          <span className="tabular-nums">
                            {(novel.wordCount ?? 0).toLocaleString()} 字
                          </span>
                          <span>
                            {novel.updateTime
                              ? new Date(novel.updateTime).toLocaleDateString('zh-CN', {
                                  month: '2-digit',
                                  day: '2-digit',
                                })
                              : '—'}
                          </span>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </ScrollArea>

      {/* 新建对话框 */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              开始一段新故事
            </DialogTitle>
            <DialogDescription>创建之后可以随时在工作台完善大纲、人物与设定。</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-5 py-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="novel-title">标题</Label>
              <Input
                id="novel-title"
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                placeholder="例如：山海奇缘"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="novel-genre">流派</Label>
                <Select
                  value={createForm.genre}
                  onValueChange={(v) => setCreateForm({ ...createForm, genre: v })}
                >
                  <SelectTrigger id="novel-genre">
                    <SelectValue placeholder="可选" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {NOVEL_GENRE_OPTIONS.map((g) => (
                        <SelectItem key={g} value={g}>
                          {g}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="novel-tags">标签</Label>
                <Input
                  id="novel-tags"
                  value={createForm.tags}
                  onChange={(e) => setCreateForm({ ...createForm, tags: e.target.value })}
                  placeholder="用逗号分隔"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="novel-summary">简介</Label>
              <Textarea
                id="novel-summary"
                rows={3}
                value={createForm.summary}
                onChange={(e) => setCreateForm({ ...createForm, summary: e.target.value })}
                placeholder="一两句话概括这个故事……"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting ? '创建中…' : '创建并进入'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑对话框 */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>编辑作品信息</DialogTitle>
            <DialogDescription>修改基本信息，不影响章节与人物数据。</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-5 py-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-title">标题</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-genre">流派</Label>
                <Select
                  value={editForm.genre}
                  onValueChange={(v) => setEditForm({ ...editForm, genre: v })}
                >
                  <SelectTrigger id="edit-genre">
                    <SelectValue placeholder="选择流派" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {NOVEL_GENRE_OPTIONS.map((g) => (
                        <SelectItem key={g} value={g}>
                          {g}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-tags">标签</Label>
                <Input
                  id="edit-tags"
                  value={editForm.tags}
                  onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-summary">简介</Label>
              <Textarea
                id="edit-summary"
                rows={3}
                value={editForm.summary}
                onChange={(e) => setEditForm({ ...editForm, summary: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              取消
            </Button>
            <Button onClick={handleEdit} disabled={submitting}>
              {submitting ? '保存中…' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除对话框 */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除《{deleteTarget?.title}》？</DialogTitle>
            <DialogDescription>
              这个操作会同时删除章节、人物、关系与设定数据，不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
              {submitting ? '删除中…' : '确认删除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function MetricStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
      <span className="text-2xl font-semibold tabular-nums tracking-tight">{value}</span>
    </div>
  )
}

function EmptyState({ onCreate, hasKeyword }: { onCreate: () => void; hasKeyword: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed py-24 text-center">
      <div className="flex size-14 items-center justify-center rounded-full border bg-muted/30">
        <BookOpen className="size-6 text-muted-foreground" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-base font-medium">{hasKeyword ? '没有匹配的作品' : '这里空空如也'}</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          {hasKeyword ? '换个关键词试试，或者' : '每部作品都从一个念头开始。'}
        </p>
      </div>
      {!hasKeyword && (
        <Button onClick={onCreate}>
          <Plus data-icon="inline-start" />
          创建第一部小说
        </Button>
      )}
    </div>
  )
}
