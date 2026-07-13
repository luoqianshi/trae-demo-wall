import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { FileText, FolderKanban, Pencil, Play, Plus, RefreshCw, Sparkles, Trash2, Workflow } from 'lucide-react'
import { toast } from 'sonner'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Combobox } from '@/components/ui/combobox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { addWorkflow, createWorkflowFromTemplate, deleteWorkflow, getProject, listTemplateWorkflows, listWorkflowTemplates, listWorkflows, updateWorkflow, type FlowProject, type WorkflowSummary, type WorkflowTemplate } from './project-api'
import { useProjectContextStore } from './project-context-store'

interface ProjectDetailPageProps {
  projectId: string
}

function WorkflowSkeletonList() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index}>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              <Skeleton className="h-5 w-14" />
            </div>
          </CardHeader>
          <CardFooter className="justify-between">
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-8 w-32" />
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

export function ProjectDetailPage({ projectId }: ProjectDetailPageProps) {
  const navigate = useNavigate()
  const upsertProject = useProjectContextStore((state) => state.upsertProject)
  const setCurrentProject = useProjectContextStore((state) => state.setCurrentProject)
  const [project, setProject] = useState<FlowProject | null>(null)
  const [workflows, setWorkflows] = useState<WorkflowSummary[]>([])
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([])
  const [templateWorkflows, setTemplateWorkflows] = useState<WorkflowSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [blankOpen, setBlankOpen] = useState(false)
  const [templateOpen, setTemplateOpen] = useState(false)
  const [workflowToDelete, setWorkflowToDelete] = useState<WorkflowSummary | null>(null)
  const [blankForm, setBlankForm] = useState({ name: '', description: '', category: '', tags: [] as string[] })
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('quick')
  // 编辑工作流元信息对话框
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({ id: '', name: '', description: '', category: '', tags: [] as string[] })
  const [saving, setSaving] = useState(false)

  // 统一的选中模板：既可能是系统模板，也可能是被标记为模板的工作流
  const selectedTemplate = useMemo<{ id: string; name: string; description?: string } | null>(() => {
    if (!selectedTemplateId) return null
    const sys = templates.find((t) => t.id === selectedTemplateId)
    if (sys) return { id: sys.id, name: sys.name, description: sys.description }
    const wf = templateWorkflows.find((t) => t.id === selectedTemplateId)
    if (wf) return { id: wf.id, name: wf.name, description: wf.description }
    return null
  }, [selectedTemplateId, templates, templateWorkflows])

  // 系统模板按分类分组
  const templateCategories = useMemo(() => {
    const groups = templates.reduce<Record<string, WorkflowTemplate[]>>((acc, template) => {
      const category = template.category || '其他'
      if (!acc[category]) acc[category] = []
      acc[category].push(template)
      return acc
    }, {})
    return Object.entries(groups)
  }, [templates])

  // 当前分类下要显示的模板列表
  const currentTemplates = useMemo<WorkflowTemplate[]>(() => {
    if (selectedCategory === 'quick') return []
    const found = templateCategories.find(([category]) => category === selectedCategory)
    return found ? found[1] : []
  }, [selectedCategory, templateCategories])

  // 工作流分类选项（从现有工作流和系统模板中收集）
  const categoryOptions = useMemo(() => {
    const set = new Set<string>()
    workflows.forEach((wf) => wf.category && set.add(wf.category))
    templates.forEach((t) => t.category && set.add(t.category))
    // 预置常用分类
    ;['文本处理', '图像生成', 'Agent', '提示词', '问答', '入门'].forEach((c) => set.add(c))
    return Array.from(set).map((value) => ({ label: value, value }))
  }, [workflows, templates])

  // 标签选项（从现有工作流中收集）
  const tagOptions = useMemo(() => {
    const set = new Set<string>()
    workflows.forEach((wf) => wf.tags?.forEach((t) => set.add(t)))
    templates.forEach((t) => t.tags?.forEach((tag) => set.add(tag)))
    return Array.from(set).map((value) => ({ label: value, value }))
  }, [workflows, templates])

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const [projectData, workflowPage, templatePage, templateWorkflowPage] = await Promise.all([
        getProject(projectId),
        listWorkflows(projectId),
        listWorkflowTemplates(),
        listTemplateWorkflows(),
      ])
      setProject(projectData)
      setCurrentProject(projectData)
      upsertProject(projectData)
      setWorkflows(workflowPage.records)
      setTemplates(templatePage.records)
      setTemplateWorkflows(templateWorkflowPage.records)
      setSelectedTemplateId((current) => (templatePage.records.some((item) => item.id === current) ? current : (templatePage.records[0]?.id ?? '')))
    } catch (error) {
      void error
      toast.error('项目详情加载失败，请检查后端服务')
    } finally {
      setLoading(false)
    }
  }, [projectId, setCurrentProject, upsertProject])

  useEffect(() => {
    void reload()
  }, [reload])

  const openWorkflow = (workflowId: string) => {
    navigate({ to: '/flow', search: { projectId, workflowId } })
  }

  const handleCreateBlank = async () => {
    setCreating(true)
    try {
      const workflowId = await addWorkflow({
        projectId,
        name: blankForm.name.trim() || '未命名工作流',
        description: blankForm.description,
        category: blankForm.category,
        tags: blankForm.tags.join(','),
      })
      toast.success('工作流已创建')
      setBlankOpen(false)
      setBlankForm({ name: '', description: '', category: '', tags: [] })
      openWorkflow(workflowId)
    } catch {
      toast.error('创建工作流失败')
    } finally {
      setCreating(false)
    }
  }

  const handleCreateFromTemplate = async () => {
    if (!selectedTemplate) {
      toast.error('请选择模板')
      return
    }
    setCreating(true)
    try {
      const workflowId = await createWorkflowFromTemplate({
        projectId,
        templateId: selectedTemplate.id,
        name: `${selectedTemplate.name} 副本`,
        description: selectedTemplate.description,
      })
      toast.success('已从模板创建工作流')
      setTemplateOpen(false)
      openWorkflow(workflowId)
    } catch {
      toast.error('模板创建失败')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteWorkflow = async () => {
    if (!workflowToDelete) return
    try {
      await deleteWorkflow(workflowToDelete.id)
      toast.success('工作流已删除')
      setWorkflowToDelete(null)
      void reload()
    } catch {
      toast.error('删除失败')
    }
  }

  // 打开编辑工作流元信息对话框
  const handleOpenEdit = (workflow: WorkflowSummary) => {
    setEditForm({
      id: workflow.id,
      name: workflow.name,
      description: workflow.description ?? '',
      category: workflow.category ?? '',
      tags: workflow.tags ?? [],
    })
    setEditOpen(true)
  }

  // 保存工作流元信息
  const handleSaveEdit = async () => {
    if (!editForm.name.trim()) {
      toast.error('工作流名称不能为空')
      return
    }
    setSaving(true)
    try {
      await updateWorkflow({
        id: editForm.id,
        name: editForm.name.trim(),
        description: editForm.description,
        category: editForm.category,
        tags: editForm.tags.join(','),
      })
      toast.success('工作流信息已更新')
      setEditOpen(false)
      void reload()
    } catch {
      toast.error('更新失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div className="relative">
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/10 via-transparent to-transparent blur-2xl" />
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              {project?.name ?? '项目详情'}
            </h1>
            <Badge variant="secondary" className="animate-in fade-in slide-in-from-left-2 duration-500">
              {project?.scenario ?? 'Project'}
            </Badge>
          </div>
          <p className="text-muted-foreground animate-in fade-in slide-in-from-top-2 duration-500 delay-100">
            {project?.description || '管理工作流和模板创建'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={reload} disabled={loading} className="transition-all hover:scale-105">
            <RefreshCw className={cn('mr-2 size-4', loading && 'animate-spin')} />
            刷新
          </Button>
          <Button variant="outline" onClick={() => setTemplateOpen(true)} className="transition-all hover:scale-105">
            <Sparkles className="mr-2 size-4" />
            从模板创建
          </Button>
          <Button onClick={() => setBlankOpen(true)} className="transition-all hover:scale-105">
            <Plus className="mr-2 size-4" />
            空白工作流
          </Button>
        </div>
      </div>

      <Separator className="my-2 shadow-sm" />

      <div className="faded-bottom no-scrollbar flex flex-col gap-4 overflow-auto pb-16">
        <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-background px-3 py-2 text-sm text-muted-foreground">
          <Workflow className="size-4" />
          <span>{workflows.length} 个工作流</span>
        </div>

        {loading ? (
          <WorkflowSkeletonList />
        ) : workflows.length === 0 ? (
          <Card className="border-dashed">
            <CardHeader className="items-center text-center">
              <div className="rounded-full bg-muted p-3">
                <Workflow />
              </div>
              <CardTitle>这个项目还没有工作流</CardTitle>
              <CardDescription>可以从空白画布开始，也可以从系统模板快速创建。</CardDescription>
            </CardHeader>
            <CardFooter className="justify-center gap-2">
              <Button variant="outline" onClick={() => setTemplateOpen(true)}>
                <Sparkles className="mr-2 size-4" />
                从模板创建
              </Button>
              <Button onClick={() => setBlankOpen(true)}>
                <Plus className="mr-2 size-4" />
                空白工作流
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <div className="rounded-lg border bg-background">
            <div className="grid grid-cols-[1fr_120px_140px_100px_140px] gap-4 border-b bg-muted/30 px-4 py-3 text-sm font-medium text-muted-foreground">
              <div>名称</div>
              <div>分类</div>
              <div>标签</div>
              <div>创建时间</div>
              <div className="text-right">操作</div>
            </div>
            <div className="divide-y">
              {workflows.map((workflow, index) => (
                <div
                  key={workflow.id}
                  onClick={() => openWorkflow(workflow.id)}
                  className="group grid grid-cols-[1fr_120px_140px_100px_140px] items-center gap-4 px-4 py-3 text-sm transition-colors hover:bg-muted/50 cursor-pointer animate-in fade-in slide-in-from-bottom-2"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex flex-col gap-1 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">{workflow.name}</span>
                      <Badge variant={workflow.status === 'active' ? 'default' : 'outline'} className="shrink-0 text-xs">
                        {workflow.status === 'draft' ? '草稿' : workflow.status === 'active' ? '运行中' : '归档'}
                      </Badge>
                    </div>
                    {workflow.description && (
                      <span className="truncate text-xs text-muted-foreground">{workflow.description}</span>
                    )}
                  </div>
                  <div>
                    {workflow.category ? (
                      <Badge variant="outline" className="text-xs">
                        <FolderKanban className="mr-1 size-3" />
                        {workflow.category}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 overflow-hidden">
                    {workflow.tags && workflow.tags.length > 0 ? (
                      workflow.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                    {workflow.tags && workflow.tags.length > 2 && (
                      <Badge variant="outline" className="text-xs">+{workflow.tags.length - 2}</Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {workflow.createTime ? new Date(workflow.createTime).toLocaleDateString() : '-'}
                  </div>
                  <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="icon" variant="ghost" className="size-7" onClick={() => handleOpenEdit(workflow)}>
                          <Pencil className="size-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>编辑信息</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="icon" variant="ghost" className="size-7" onClick={() => setWorkflowToDelete(workflow)}>
                          <Trash2 className="size-3.5 text-destructive" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>删除</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="icon" variant="ghost" className="size-7" onClick={() => openWorkflow(workflow.id)}>
                          <Play className="size-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>打开工作流</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Dialog open={blankOpen} onOpenChange={setBlankOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建空白工作流</DialogTitle>
            <DialogDescription>创建后会直接进入编辑器，并绑定当前项目子路由上下文。</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="workflow-name">工作流名称</Label>
              <Input id="workflow-name" value={blankForm.name} onChange={(event) => setBlankForm((value) => ({ ...value, name: event.target.value }))} placeholder="例如：文章摘要助手" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="workflow-description">描述</Label>
              <Textarea id="workflow-description" value={blankForm.description} onChange={(event) => setBlankForm((value) => ({ ...value, description: event.target.value }))} placeholder="这个工作流解决什么问题？" />
            </div>
            <div className="flex flex-col gap-2">
              <Label>分类</Label>
              <Combobox
                mode="single"
                value={blankForm.category}
                options={categoryOptions}
                placeholder="选择或输入分类"
                searchPlaceholder="搜索分类..."
                emptyText="无匹配分类"
                allowCreate
                onChange={(value) => setBlankForm((prev) => ({ ...prev, category: value }))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>标签</Label>
              <Combobox
                mode="multi"
                value={blankForm.tags}
                options={tagOptions}
                placeholder="添加标签"
                searchPlaceholder="搜索或输入标签..."
                emptyText="无匹配标签"
                allowCreate
                onChange={(value) => setBlankForm((prev) => ({ ...prev, tags: value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlankOpen(false)}>取消</Button>
            <Button onClick={handleCreateBlank} disabled={creating}>{creating ? '创建中...' : '创建并打开'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={templateOpen} onOpenChange={setTemplateOpen}>
        <DialogContent className="flex h-[80vh] max-h-[90vh] flex-col sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>从模板创建工作流</DialogTitle>
            <DialogDescription>左侧选择分类，右侧选择模板创建工作流。</DialogDescription>
          </DialogHeader>
          <div className="flex min-h-0 flex-1 gap-4 overflow-hidden">
            {/* 左侧：分类切换按钮 */}
            <div className="flex w-44 shrink-0 flex-col border-r pr-2">
              <nav className="flex-1 space-y-1 overflow-auto">
                {/* 快速创建分类 */}
                <button
                  type="button"
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition',
                    selectedCategory === 'quick'
                      ? 'bg-primary/10 font-medium text-primary'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  )}
                  onClick={() => setSelectedCategory('quick')}
                >
                  <Sparkles className="size-3.5" />
                  <span className="flex-1">快速创建</span>
                  <Badge variant="outline" className="text-[10px]">{templateWorkflows.length}</Badge>
                </button>

                {/* 分割线 */}
                {templateCategories.length > 0 && (
                  <div className="my-2 flex items-center gap-2 px-2.5">
                    <Separator className="flex-1" />
                  </div>
                )}

                {/* 系统模板分类 */}
                {templateCategories.map(([category, items]) => (
                  <button
                    key={category}
                    type="button"
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition',
                      selectedCategory === category
                        ? 'bg-primary/10 font-medium text-primary'
                        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                    )}
                    onClick={() => setSelectedCategory(category)}
                  >
                    <FileText className="size-3.5" />
                    <span className="flex-1 truncate">{category}</span>
                    <Badge variant="outline" className="text-[10px]">{items.length}</Badge>
                  </button>
                ))}
              </nav>
            </div>

            {/* 右侧：当前分类下的模板列表 */}
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
              <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                {selectedCategory === 'quick' ? (
                  <>
                    <Sparkles className="size-3.5 text-primary" />
                    快速创建
                  </>
                ) : (
                  <>
                    <FileText className="size-3.5" />
                    {selectedCategory}
                  </>
                )}
              </div>
              <div className="flex-1 overflow-auto pr-1">
                {selectedCategory === 'quick' ? (
                  templateWorkflows.length === 0 ? (
                    <p className="py-8 text-center text-xs text-muted-foreground">
                      暂无快速创建模板。可在工作流编辑器中点击"存为模板"添加。
                    </p>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {templateWorkflows.map((wf) => (
                        <button
                          key={wf.id}
                          type="button"
                          className={cn(
                            'rounded-lg border bg-card p-3 text-left transition hover:border-primary hover:bg-muted/50',
                            selectedTemplateId === wf.id && 'border-primary bg-muted ring-1 ring-primary'
                          )}
                          onClick={() => setSelectedTemplateId(wf.id)}
                        >
                          <div className="truncate text-sm font-medium">{wf.name}</div>
                          <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{wf.description || '暂无描述'}</p>
                        </button>
                      ))}
                    </div>
                  )
                ) : currentTemplates.length === 0 ? (
                  <p className="py-8 text-center text-xs text-muted-foreground">该分类暂无模板</p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {currentTemplates.map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        className={cn(
                          'rounded-lg border bg-card p-3 text-left transition hover:border-primary hover:bg-muted/50',
                          selectedTemplateId === template.id && 'border-primary bg-muted ring-1 ring-primary'
                        )}
                        onClick={() => setSelectedTemplateId(template.id)}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="truncate text-sm font-medium">{template.name}</div>
                          <Badge variant="outline" className="shrink-0 text-[10px]">{template.category || 'template'}</Badge>
                        </div>
                        <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{template.description}</p>
                        {template.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {template.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
                            ))}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplateOpen(false)}>取消</Button>
            <Button onClick={handleCreateFromTemplate} disabled={creating || !selectedTemplate}>{creating ? '创建中...' : '使用模板创建'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑工作流信息</DialogTitle>
            <DialogDescription>修改工作流的标题、描述、分类和标签。</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-name">工作流名称</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(event) => setEditForm((value) => ({ ...value, name: event.target.value }))}
                placeholder="工作流名称"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-description">描述</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(event) => setEditForm((value) => ({ ...value, description: event.target.value }))}
                placeholder="这个工作流解决什么问题？"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>分类</Label>
              <Combobox
                mode="single"
                value={editForm.category}
                options={categoryOptions}
                placeholder="选择或输入分类"
                searchPlaceholder="搜索分类..."
                emptyText="无匹配分类"
                allowCreate
                onChange={(value) => setEditForm((prev) => ({ ...prev, category: value }))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>标签</Label>
              <Combobox
                mode="multi"
                value={editForm.tags}
                options={tagOptions}
                placeholder="添加标签"
                searchPlaceholder="搜索或输入标签..."
                emptyText="无匹配标签"
                allowCreate
                onChange={(value) => setEditForm((prev) => ({ ...prev, tags: value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>取消</Button>
            <Button onClick={handleSaveEdit} disabled={saving || !editForm.name.trim()}>
              {saving ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!workflowToDelete} onOpenChange={(open) => !open && setWorkflowToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除工作流</AlertDialogTitle>
            <AlertDialogDescription>确定删除“{workflowToDelete?.name}”吗？删除后该工作流不会再出现在当前项目中。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleDeleteWorkflow()}>确认删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
