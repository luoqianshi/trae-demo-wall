import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  ArrowRight,
  Library,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import {
  knowledgeBaseApi,
  type KnowledgeBase,
  type KnowledgeBaseAddRequest,
  type KnowledgeBaseUpdateRequest,
} from './api/knowledge-api'
import { useKnowledgeContextStore } from './knowledge-context-store'

const defaultForm = {
  name: '',
  description: '',
  domain: '通用',
}

export function KnowledgeBaseListPage() {
  const setKnowledgeBases = useKnowledgeContextStore((state) => state.setKnowledgeBases)
  const setCurrentKnowledgeBase = useKnowledgeContextStore((state) => state.setCurrentKnowledgeBase)
  const [knowledgeBases, setKnowledgeBasesLocal] = useState<KnowledgeBase[]>([])
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // 新建对话框
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [createForm, setCreateForm] = useState(defaultForm)

  // 编辑对话框
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editForm, setEditForm] = useState<KnowledgeBaseUpdateRequest & { description?: string }>({
    id: '',
    name: '',
    description: '',
    domain: '',
  })

  // 删除确认对话框
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<KnowledgeBase | null>(null)

  const filteredKnowledgeBases = useMemo(() => {
    const text = keyword.trim().toLowerCase()
    if (!text) return knowledgeBases
    return knowledgeBases.filter((kb) =>
      [kb.name, kb.description, kb.domain].some((value) => value?.toLowerCase().includes(text))
    )
  }, [keyword, knowledgeBases])

  const reloadKnowledgeBases = useCallback(async () => {
    setLoading(true)
    try {
      const result = await knowledgeBaseApi.list({ current: 1, pageSize: 100 })
      setKnowledgeBasesLocal(result.list)
      setKnowledgeBases(result.list)
    } catch {
      toast.error('知识库加载失败，请检查后端服务')
    } finally {
      setLoading(false)
    }
  }, [setKnowledgeBases])

  useEffect(() => {
    void reloadKnowledgeBases()
  }, [reloadKnowledgeBases])

  /* ---- 新建 ---- */
  const handleCreate = async () => {
    if (!createForm.name.trim()) {
      toast.error('知识库名称不能为空')
      return
    }
    setSubmitting(true)
    try {
      const payload: KnowledgeBaseAddRequest = {
        projectId: 'default',
        name: createForm.name,
        description: createForm.description,
        domain: createForm.domain,
      }
      await knowledgeBaseApi.add(payload)
      toast.success('知识库已创建')
      setCreateDialogOpen(false)
      setCreateForm(defaultForm)
      void reloadKnowledgeBases()
    } catch {
      toast.error('创建失败，请检查后端服务')
    } finally {
      setSubmitting(false)
    }
  }

  /* ---- 编辑 ---- */
  const openEditDialog = (kb: KnowledgeBase) => {
    setEditForm({
      id: kb.id,
      name: kb.name,
      description: kb.description ?? '',
      domain: kb.domain ?? '通用',
    })
    setEditDialogOpen(true)
  }

  const handleEdit = async () => {
    if (!editForm.name?.trim()) {
      toast.error('知识库名称不能为空')
      return
    }
    setSubmitting(true)
    try {
      await knowledgeBaseApi.update(editForm)
      toast.success('知识库已更新')
      setEditDialogOpen(false)
      void reloadKnowledgeBases()
    } catch {
      toast.error('更新失败，请检查后端服务')
    } finally {
      setSubmitting(false)
    }
  }

  /* ---- 删除 ---- */
  const openDeleteDialog = (kb: KnowledgeBase) => {
    setDeleteTarget(kb)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setSubmitting(true)
    try {
      await knowledgeBaseApi.delete(deleteTarget.id)
      toast.success('知识库已删除')
      setDeleteDialogOpen(false)
      setDeleteTarget(null)
      void reloadKnowledgeBases()
    } catch {
      toast.error('删除失败，请检查后端服务')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">知识库管理</h1>
          <Badge variant="secondary">RAG</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={reloadKnowledgeBases} disabled={loading}>
            <RefreshCw className={cn('mr-1.5 size-3.5', loading && 'animate-spin')} />
            刷新
          </Button>
          <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-1.5 size-3.5" />
            新建
          </Button>
        </div>
      </div>

      <Separator className="shadow-sm" />

      <div className="faded-bottom no-scrollbar flex flex-col gap-3 overflow-auto pb-16">
        {/* 搜索栏 */}
        <div className="flex items-center gap-2 rounded-md border bg-background px-2 py-1.5">
          <Search className="size-3.5 shrink-0 text-muted-foreground" />
          <Input
            className="h-7 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索知识库名称、描述或领域"
          />
          <span className="shrink-0 text-xs text-muted-foreground">{knowledgeBases.length} 个</span>
        </div>

        {/* 列表 */}
        {loading ? (
          <div className="flex flex-col gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-md bg-muted/40" />
            ))}
          </div>
        ) : filteredKnowledgeBases.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
            <Library className="size-8" />
            <p className="text-sm">还没有知识库</p>
            <Button size="sm" variant="outline" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-1.5 size-3.5" />
              新建知识库
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-px rounded-md border">
            {/* 表头 */}
            <div className="flex items-center gap-3 bg-muted/40 px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
              <span className="w-8 shrink-0" />
              <span className="min-w-0 flex-1">名称</span>
              <span className="w-20 shrink-0">领域</span>
              <span className="w-24 shrink-0">文档片段</span>
              <span className="w-28 shrink-0">创建时间</span>
              <span className="w-8 shrink-0" />
            </div>
            {filteredKnowledgeBases.map((kb) => (
              <div
                key={kb.id}
                className="group flex items-center gap-3 border-t bg-background px-3 py-2 transition-colors hover:bg-muted/30"
              >
                {/* 图标 */}
                <div className="flex size-7 shrink-0 items-center justify-center rounded-md border bg-background">
                  <Library className="size-3.5 text-muted-foreground" />
                </div>

                {/* 名称 + 描述 */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <Link
                      to="/knowledge-base/$kbId"
                      params={{ kbId: kb.id }}
                      onClick={() => setCurrentKnowledgeBase(kb)}
                      className="truncate text-[13px] font-medium hover:underline"
                    >
                      {kb.name}
                    </Link>
                    <ArrowRight className="size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  {kb.description && (
                    <p className="truncate text-[11px] text-muted-foreground">{kb.description}</p>
                  )}
                </div>

                {/* 领域 */}
                <Badge variant="secondary" className="w-20 shrink-0 justify-center text-[10px]">
                  {kb.domain || '通用'}
                </Badge>

                {/* 文档片段 */}
                <span className="w-24 shrink-0 text-[12px] text-muted-foreground">
                  {kb.chunkCount ?? 0} 个片段
                </span>

                {/* 创建时间 */}
                <span className="w-28 shrink-0 text-[12px] text-muted-foreground">
                  {kb.createTime ? new Date(kb.createTime).toLocaleDateString() : '-'}
                </span>

                {/* 操作 */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 shrink-0 opacity-0 group-hover:opacity-100"
                    >
                      <MoreHorizontal className="size-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEditDialog(kb)}>
                      <Pencil className="mr-2 size-3.5" />
                      编辑
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => openDeleteDialog(kb)}
                    >
                      <Trash2 className="mr-2 size-3.5" />
                      删除
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 新建对话框 */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建知识库</DialogTitle>
            <DialogDescription>知识库用于存储文档和向量数据，为智能体提供知识支持。</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="create-name">知识库名称</Label>
              <Input
                id="create-name"
                value={createForm.name}
                onChange={(e) => setCreateForm((v) => ({ ...v, name: e.target.value }))}
                placeholder="例如：产品文档库"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="create-domain">领域</Label>
              <Input
                id="create-domain"
                value={createForm.domain}
                onChange={(e) => setCreateForm((v) => ({ ...v, domain: e.target.value }))}
                placeholder="例如：通用、技术、业务"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="create-desc">知识库描述</Label>
              <Textarea
                id="create-desc"
                value={createForm.description}
                onChange={(e) => setCreateForm((v) => ({ ...v, description: e.target.value }))}
                placeholder="简单说明这个知识库用来存储什么类型的文档"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting ? '创建中...' : '创建知识库'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑对话框 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑知识库</DialogTitle>
            <DialogDescription>修改知识库的基本信息。</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-name">知识库名称</Label>
              <Input
                id="edit-name"
                value={editForm.name ?? ''}
                onChange={(e) => setEditForm((v) => ({ ...v, name: e.target.value }))}
                placeholder="例如：产品文档库"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-domain">领域</Label>
              <Input
                id="edit-domain"
                value={editForm.domain ?? ''}
                onChange={(e) => setEditForm((v) => ({ ...v, domain: e.target.value }))}
                placeholder="例如：通用、技术、业务"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-desc">知识库描述</Label>
              <Textarea
                id="edit-desc"
                value={editForm.description ?? ''}
                onChange={(e) => setEditForm((v) => ({ ...v, description: e.target.value }))}
                placeholder="简单说明这个知识库用来存储什么类型的文档"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleEdit} disabled={submitting}>
              {submitting ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除知识库</DialogTitle>
            <DialogDescription>
              确定要删除知识库「{deleteTarget?.name}」吗？此操作不可撤销，知识库中的所有文档和向量数据将被永久删除。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
              {submitting ? '删除中...' : '确认删除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
