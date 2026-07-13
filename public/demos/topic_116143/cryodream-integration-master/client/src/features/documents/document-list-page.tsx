import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { FileText, MoreHorizontal, Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { documentApi, type DocumentItem } from './document-api'

export function DocumentListPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // 新建对话框
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [createForm, setCreateForm] = useState({ title: '' })

  // 编辑对话框
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editForm, setEditForm] = useState({ id: '', title: '' })

  // 删除确认
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<DocumentItem | null>(null)

  const filteredDocuments = useMemo(() => {
    const text = keyword.trim().toLowerCase()
    if (!text) return documents
    return documents.filter((doc) =>
      [doc.title, doc.tags, doc.status].some((v) => v?.toLowerCase().includes(text))
    )
  }, [keyword, documents])

  const reloadDocuments = useCallback(async () => {
    setLoading(true)
    try {
      const result = await documentApi.list({ current: 1, pageSize: 100 })
      setDocuments(result.list)
    } catch {
      toast.error('文档加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reloadDocuments()
  }, [reloadDocuments])

  const handleCreate = async () => {
    if (!createForm.title.trim()) {
      toast.error('文档标题不能为空')
      return
    }
    setSubmitting(true)
    try {
      await documentApi.add({ title: createForm.title.trim() })
      toast.success('文档已创建')
      setCreateDialogOpen(false)
      setCreateForm({ title: '' })
      void reloadDocuments()
    } catch {
      toast.error('创建失败')
    } finally {
      setSubmitting(false)
    }
  }

  const openEditDialog = (doc: DocumentItem) => {
    setEditForm({ id: doc.id, title: doc.title })
    setEditDialogOpen(true)
  }

  const handleEdit = async () => {
    if (!editForm.title.trim()) {
      toast.error('文档标题不能为空')
      return
    }
    setSubmitting(true)
    try {
      await documentApi.update({ id: editForm.id, title: editForm.title.trim() })
      toast.success('文档已更新')
      setEditDialogOpen(false)
      void reloadDocuments()
    } catch {
      toast.error('更新失败')
    } finally {
      setSubmitting(false)
    }
  }

  const openDeleteDialog = (doc: DocumentItem) => {
    setDeleteTarget(doc)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setSubmitting(true)
    try {
      await documentApi.delete(deleteTarget.id)
      toast.success('文档已删除')
      setDeleteDialogOpen(false)
      setDeleteTarget(null)
      void reloadDocuments()
    } catch {
      toast.error('删除失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">文档管理</h1>
          <Badge variant="secondary">Markdown</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={reloadDocuments} disabled={loading}>
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
            placeholder="搜索文档标题"
          />
          <span className="shrink-0 text-xs text-muted-foreground">{documents.length} 个</span>
        </div>

        {/* 列表 */}
        {loading ? (
          <div className="flex flex-col gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-md bg-muted/40" />
            ))}
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
            <FileText className="size-8" />
            <p className="text-sm">还没有文档</p>
            <Button size="sm" variant="outline" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-1.5 size-3.5" />
              新建文档
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-px rounded-md border">
            {/* 表头 */}
            <div className="flex items-center gap-3 bg-muted/40 px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
              <span className="w-8 shrink-0" />
              <span className="min-w-0 flex-1">标题</span>
              <span className="w-16 shrink-0">状态</span>
              <span className="w-28 shrink-0">更新时间</span>
              <span className="w-8 shrink-0" />
            </div>
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className="group flex items-center gap-3 border-t bg-background px-3 py-2 transition-colors hover:bg-muted/30"
              >
                <div className="flex size-7 shrink-0 items-center justify-center rounded-md border bg-background">
                  <FileText className="size-3.5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    to="/documents/$docId"
                    params={{ docId: doc.id }}
                    className="truncate text-[13px] font-medium hover:underline"
                  >
                    {doc.title}
                  </Link>
                </div>
                <Badge variant={doc.status === 'published' ? 'default' : 'secondary'} className="w-16 shrink-0 justify-center text-[10px]">
                  {doc.status === 'published' ? '已发布' : '草稿'}
                </Badge>
                <span className="w-28 shrink-0 text-[12px] text-muted-foreground">
                  {doc.updateTime ? new Date(doc.updateTime).toLocaleDateString() : '-'}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-7 shrink-0 opacity-0 group-hover:opacity-100">
                      <MoreHorizontal className="size-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEditDialog(doc)}>
                      <Pencil className="mr-2 size-3.5" />
                      编辑
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => openDeleteDialog(doc)}>
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
            <DialogTitle>新建文档</DialogTitle>
            <DialogDescription>创建一个 Markdown 文档。</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="doc-title">文档标题</Label>
              <Input id="doc-title" value={createForm.title} onChange={(e) => setCreateForm({ title: e.target.value })} placeholder="输入文档标题" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>取消</Button>
            <Button onClick={handleCreate} disabled={submitting}>{submitting ? '创建中...' : '创建'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑对话框 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑文档</DialogTitle>
            <DialogDescription>修改文档标题。</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-title">文档标题</Label>
              <Input id="edit-title" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>取消</Button>
            <Button onClick={handleEdit} disabled={submitting}>{submitting ? '保存中...' : '保存'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除文档</DialogTitle>
            <DialogDescription>确定要删除文档「{deleteTarget?.title}」吗？此操作不可撤销。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={submitting}>{submitting ? '删除中...' : '确认删除'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
