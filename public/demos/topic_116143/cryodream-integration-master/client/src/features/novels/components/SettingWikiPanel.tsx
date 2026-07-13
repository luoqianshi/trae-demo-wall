import { useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
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
import { SETTING_CATEGORY_LABEL, SETTING_CATEGORY_OPTIONS } from '../constants'
import { novelSettingApi, type NovelSettingItem } from '../api/novel-api'

interface Props {
  novelId: string
}

const emptyForm = { category: 'location', name: '', brief: '', content: '' }

export function SettingWikiPanel({ novelId }: Props) {
  const [items, setItems] = useState<NovelSettingItem[]>([])
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [form, setForm] = useState<{
    id?: string
    category: string
    name: string
    brief: string
    content: string
  }>(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  const reload = async () => {
    try {
      const list = await novelSettingApi.list(novelId)
      setItems(list)
      if (activeId && !list.find((i) => i.id === activeId)) {
        setActiveId(null)
      }
    } catch {
      toast.error('设定列表加载失败')
    }
  }

  useEffect(() => {
    void reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [novelId])

  const filtered = useMemo(
    () =>
      activeCategory === 'all' ? items : items.filter((i) => i.category === activeCategory),
    [items, activeCategory]
  )

  const grouped = useMemo(() => {
    const map: Record<string, number> = { all: items.length }
    SETTING_CATEGORY_OPTIONS.forEach((o) => {
      map[o.value] = items.filter((i) => i.category === o.value).length
    })
    return map
  }, [items])

  const active = items.find((i) => i.id === activeId) ?? null

  const openCreate = () => {
    setForm({
      ...emptyForm,
      category: activeCategory === 'all' ? 'location' : activeCategory,
    })
    setEditOpen(true)
  }

  const openEdit = (item: NovelSettingItem) => {
    setForm({
      id: item.id,
      category: item.category,
      name: item.name,
      brief: item.brief ?? '',
      content: item.content ?? '',
    })
    setEditOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('名称不能为空')
      return
    }
    setSubmitting(true)
    try {
      if (form.id) {
        await novelSettingApi.update({
          id: form.id,
          category: form.category,
          name: form.name.trim(),
          brief: form.brief.trim(),
          content: form.content,
        })
      } else {
        const id = await novelSettingApi.add({
          novelId,
          category: form.category,
          name: form.name.trim(),
          brief: form.brief.trim(),
          content: form.content,
        })
        setActiveId(id)
      }
      toast.success('已保存')
      setEditOpen(false)
      void reload()
    } catch (e) {
      toast.error((e as Error).message || '保存失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (item: NovelSettingItem) => {
    if (!confirm(`确定要删除「${item.name}」吗？`)) return
    try {
      await novelSettingApi.delete(item.id)
      toast.success('已删除')
      if (activeId === item.id) setActiveId(null)
      void reload()
    } catch (e) {
      toast.error((e as Error).message || '删除失败')
    }
  }

  return (
    <div className="flex h-full min-h-[500px] gap-4 rounded-xl border bg-card p-1">
      {/* 左：分类树 */}
      <div className="flex w-44 shrink-0 flex-col gap-1 rounded-lg border-e bg-muted/10 p-3">
        <div className="mb-1 px-2 text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Category
        </div>
        <CategoryButton
          label="全部"
          active={activeCategory === 'all'}
          count={grouped.all}
          onClick={() => setActiveCategory('all')}
        />
        <div className="my-1 h-px bg-border/60" />
        {SETTING_CATEGORY_OPTIONS.map((o) => (
          <CategoryButton
            key={o.value}
            label={o.label}
            active={activeCategory === o.value}
            count={grouped[o.value] ?? 0}
            onClick={() => setActiveCategory(o.value)}
          />
        ))}
      </div>

      {/* 中：列表 */}
      <div className="flex w-60 shrink-0 flex-col gap-2 border-e py-3 pe-2">
        <div className="flex items-center justify-between px-2">
          <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Entries
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 gap-1 px-2 text-[11px]"
            onClick={openCreate}
          >
            <Plus className="size-3" />
            新增
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-1 px-2">
            {filtered.length === 0 ? (
              <p className="rounded-md border border-dashed p-4 text-center text-[11px] text-muted-foreground">
                暂无条目
              </p>
            ) : (
              filtered.map((item) => (
                <button
                  key={item.id}
                  className={cn(
                    'group flex flex-col gap-1 rounded-md border p-2.5 text-left transition-colors',
                    activeId === item.id
                      ? 'border-primary/60 bg-primary/5'
                      : 'border-transparent hover:border-border hover:bg-muted/40'
                  )}
                  onClick={() => setActiveId(item.id)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">{item.name}</span>
                    <Badge variant="outline" className="h-4 shrink-0 px-1 text-[10px] font-normal">
                      {SETTING_CATEGORY_LABEL[item.category] ?? item.category}
                    </Badge>
                  </div>
                  {item.brief && (
                    <p className="line-clamp-1 text-[11px] text-muted-foreground">{item.brief}</p>
                  )}
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
            <p className="text-sm font-medium">选择或创建一个设定条目</p>
            <p className="max-w-xs text-xs text-muted-foreground">
              地点、组织、物品、势力……将虚构世界的每一块拼图沉淀在这里。
            </p>
          </div>
        ) : (
          <>
            <div className="flex shrink-0 items-center justify-between gap-2 border-b px-6 py-3">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="font-normal">
                  {SETTING_CATEGORY_LABEL[active.category] ?? active.category}
                </Badge>
                <h2 className="text-xl font-semibold tracking-tight">{active.name}</h2>
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
            <ScrollArea className="flex-1">
              <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-8 py-8">
                {active.brief && (
                  <p className="text-base leading-relaxed text-muted-foreground">{active.brief}</p>
                )}
                <div className="max-w-none">
                  <pre className="whitespace-pre-wrap break-words border-0 bg-transparent p-0 font-sans text-[15px] leading-[1.8] text-foreground/90">
                    {active.content || '（暂无内容，点击编辑补充）'}
                  </pre>
                </div>
              </div>
            </ScrollArea>
          </>
        )}
      </div>

      {/* 编辑弹窗 */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? '编辑设定' : '新建设定'}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-5 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label>分类</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm({ ...form, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {SETTING_CATEGORY_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>名称 *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="例如：青云宗、飞剑「霜华」"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label>简述</Label>
              <Input
                value={form.brief}
                onChange={(e) => setForm({ ...form, brief: e.target.value })}
                placeholder="一句话概括"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>正文</Label>
              <Textarea
                rows={10}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="详细描述，支持 Markdown"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
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

function CategoryButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string
  count: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center justify-between rounded-md px-2 py-1.5 text-left text-sm transition-colors',
        active ? 'bg-primary/10 font-medium text-foreground' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
      )}
    >
      <span>{label}</span>
      <span className="font-mono text-[10px] tabular-nums">{count}</span>
    </button>
  )
}
