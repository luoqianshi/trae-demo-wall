import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearch } from '@tanstack/react-router'
import { Bot, Database, ExternalLink, FolderKanban, FolderOpen, Layers3, MousePointer2, Pencil, Plus, RefreshCw, Search, Trash2, X, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { addProject, updateProject, listProjects, listWorkflows, addWorkflow, createWorkflowFromTemplate, deleteWorkflow, updateWorkflow, listWorkflowTemplates, listTemplateWorkflows, getWorkflow, type FlowProject, type WorkflowSummary, type WorkflowTemplate } from '@/features/projects/project-api'
import { useProjectContextStore } from '@/features/projects/project-context-store'
import { Combobox } from '@/components/ui/combobox'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useWorkflowTabsStore } from '@/features/flow/stores/workflow-tabs-store'
import { useFlowDebugStore } from '@/features/flow/stores/useFlowDebugStore'
import { useFlowStore } from '@/features/flow/stores/useFlowStore'
import { useDragAndDrop } from '@/features/flow/utils/useDragAndDrop'
import { listEnabledModelConfigs } from '@/features/model-config/model-config-store'
import Toolbar from '@/features/flow/components/Toolbar'
import NodePanel from '@/features/flow/components/NodePanel'
import FlowCanvas from '@/features/flow/components/FlowCanvas'
import PropertyPanel from '@/features/flow/components/PropertyPanel'
import WorkflowDebugPanel from '@/features/flow/components/debug/WorkflowDebugPanel'
import type { FlowData } from '@/features/flow/types'

const defaultForm = { name: '', description: '', scenario: '个人自动化', color: 'blue', icon: 'FolderKanban' }

export function WorkspacePage() {
  const search = useSearch({ strict: false }) as { projectId?: string; workflowId?: string; mode?: string }
  const urlProjectId = search.projectId
  const urlWorkflowId = search.workflowId
  const urlMode = search.mode

  const setProjectMenuItems = useProjectContextStore((state) => state.setProjects)
  const setCurrentProject = useProjectContextStore((state) => state.setCurrentProject)

  // ===== 项目空间状态 =====
  const [projects, setProjects] = useState<FlowProject[]>([])
  const [selectedProject, setSelectedProject] = useState<FlowProject | null>(null)
  const [workflows, setWorkflows] = useState<WorkflowSummary[]>([])
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([])
  const [templateWorkflows, setTemplateWorkflows] = useState<WorkflowSummary[]>([])
  const [keyword, setKeyword] = useState('')
  const [projectLoading, setProjectLoading] = useState(false)
  const [workflowLoading, setWorkflowLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [blankOpen, setBlankOpen] = useState(false)
  const [templateOpen, setTemplateOpen] = useState(false)
  const [workflowToDelete, setWorkflowToDelete] = useState<WorkflowSummary | null>(null)
  const [blankForm, setBlankForm] = useState({ name: '', description: '', category: '', tags: [] as string[] })
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [kbTemplateSelected, setKbTemplateSelected] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('quick')
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({ id: '', name: '', description: '', category: '', tags: [] as string[] })
  const [saving, setSaving] = useState(false)
  const [projectEditOpen, setProjectEditOpen] = useState(false)
  const [projectEditForm, setProjectEditForm] = useState({ id: '', name: '', description: '', scenario: '' })
  const [projectSaving, setProjectSaving] = useState(false)

  // ===== 工作流标签页状态 =====
  const tabs = useWorkflowTabsStore((state) => state.tabs)
  const activeTabId = useWorkflowTabsStore((state) => state.activeTabId)
  const addTab = useWorkflowTabsStore((state) => state.addTab)
  const removeTab = useWorkflowTabsStore((state) => state.removeTab)
  const setActiveTab = useWorkflowTabsStore((state) => state.setActiveTab)

  // ===== 工作流编辑器状态 =====
  const { onDragStart } = useDragAndDrop()
  const debugOpen = useFlowDebugStore((state) => state.open)
  const setOpen = useFlowDebugStore((state) => state.setOpen)
  const loadFlow = useFlowStore((state) => state.loadFlow)
  const loadKnowledgePipeline = useFlowStore((state) => state.loadKnowledgePipeline)
  const [nodePanelOpen, setNodePanelOpen] = useState(true)

  // 当前视图：'projects' 或 工作流ID
  const currentView = activeTabId || 'projects'

  // ===== 数据加载 =====
  const filteredProjects = useMemo(() => {
    const text = keyword.trim().toLowerCase()
    if (!text) return projects
    return projects.filter((p) => [p.name, p.description, p.scenario].some((v) => v?.toLowerCase().includes(text)))
  }, [keyword, projects])

  const selectedTemplate = useMemo<{ id: string; name: string; description?: string } | null>(() => {
    if (!selectedTemplateId) return null
    const sys = templates.find((t) => t.id === selectedTemplateId)
    if (sys) return { id: sys.id, name: sys.name, description: sys.description }
    const wf = templateWorkflows.find((t) => t.id === selectedTemplateId)
    if (wf) return { id: wf.id, name: wf.name, description: wf.description }
    return null
  }, [selectedTemplateId, templates, templateWorkflows])

  const templateCategories = useMemo(() => {
    const groups = templates.reduce<Record<string, WorkflowTemplate[]>>((acc, t) => {
      const cat = t.category || '其他'
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(t)
      return acc
    }, {})
    return Object.entries(groups)
  }, [templates])

  const currentTemplates = useMemo<WorkflowTemplate[]>(() => {
    if (selectedCategory === 'quick') return []
    const found = templateCategories.find(([c]) => c === selectedCategory)
    return found ? found[1] : []
  }, [selectedCategory, templateCategories])

  const categoryOptions = useMemo(() => {
    const set = new Set<string>()
    workflows.forEach((wf) => wf.category && set.add(wf.category))
    templates.forEach((t) => t.category && set.add(t.category))
    ;['文本处理', '图像生成', 'Agent', '提示词', '问答', '入门'].forEach((c) => set.add(c))
    return Array.from(set).map((v) => ({ label: v, value: v }))
  }, [workflows, templates])

  const tagOptions = useMemo(() => {
    const set = new Set<string>()
    workflows.forEach((wf) => wf.tags?.forEach((t) => set.add(t)))
    templates.forEach((t) => t.tags?.forEach((tag) => set.add(tag)))
    return Array.from(set).map((v) => ({ label: v, value: v }))
  }, [workflows, templates])

  const reloadProjects = useCallback(async () => {
    setProjectLoading(true)
    try {
      const page = await listProjects()
      setProjects(page.records)
      setProjectMenuItems(page.records)
      const targetId = urlProjectId
      const target = targetId ? page.records.find((p) => p.id === targetId) : null
      const initial = target || page.records[0] || null
      if (initial) { setSelectedProject(initial); setCurrentProject(initial) }
    } catch { toast.error('项目加载失败') }
    finally { setProjectLoading(false) }
  }, [setProjectMenuItems, urlProjectId, setCurrentProject])

  const reloadWorkflows = useCallback(async () => {
    if (!selectedProject) return
    setWorkflowLoading(true)
    try {
      const [wp, tp, twp] = await Promise.all([listWorkflows(selectedProject.id), listWorkflowTemplates(), listTemplateWorkflows()])
      setWorkflows(wp.records); setTemplates(tp.records); setTemplateWorkflows(twp.records)
      setSelectedTemplateId((cur) => (tp.records.some((i) => i.id === cur) ? cur : (tp.records[0]?.id ?? '')))
    } catch { toast.error('工作流加载失败') }
    finally { setWorkflowLoading(false) }
  }, [selectedProject])

  useEffect(() => { void reloadProjects() }, [reloadProjects])
  useEffect(() => { void reloadWorkflows() }, [reloadWorkflows])

  // URL workflowId 变化时，添加/切换标签
  useEffect(() => {
    if (urlWorkflowId && urlProjectId) {
      const existing = tabs.find((t) => t.workflowId === urlWorkflowId)
      if (!existing) {
        getWorkflow(urlWorkflowId).then((wf) => {
          addTab({ workflowId: urlWorkflowId, projectId: wf.projectId || urlProjectId, projectName: wf.projectName || '项目', workflowName: wf.name })
        }).catch(() => {
          addTab({ workflowId: urlWorkflowId, projectId: urlProjectId, projectName: '项目', workflowName: urlWorkflowId })
        })
      } else {
        setActiveTab(urlWorkflowId)
      }
    } else {
      setActiveTab(null)
    }
  }, [urlWorkflowId, urlProjectId]) // eslint-disable-line react-hooks/exhaustive-deps

  // URL mode 参数同步
  useEffect(() => {
    if (urlMode === 'debug') setOpen(true)
    else if (urlMode === 'edit') setOpen(false)
  }, [urlMode, setOpen])

  // 加载工作流数据到编辑器
  useEffect(() => {
    if (!activeTabId) return
    getWorkflow(activeTabId).then((workflow) => {
      const graph = workflow.graphJson ? (JSON.parse(workflow.graphJson) as Partial<FlowData>) : {}
      loadFlow({
        id: workflow.id, name: workflow.name, description: workflow.description,
        nodes: graph.nodes ?? [], edges: graph.edges ?? [],
        createdAt: workflow.createTime ?? new Date().toISOString(),
        updatedAt: workflow.updateTime ?? new Date().toISOString(),
      })
    }).catch(() => { toast.error('工作流加载失败') })
  }, [loadFlow, activeTabId])

  useEffect(() => { listEnabledModelConfigs().catch(() => {}) }, [])

  // ===== 操作函数 =====
  const handleCreate = async () => {
    if (!form.name.trim()) { toast.error('项目名称不能为空'); return }
    setCreating(true)
    try { await addProject(form); toast.success('项目已创建'); setDialogOpen(false); setForm(defaultForm); void reloadProjects() }
    catch { toast.error('创建失败') } finally { setCreating(false) }
  }

  // 打开工作流（无感切换）
  const openWorkflow = (id: string) => {
    const wf = workflows.find((w) => w.id === id)
    if (wf && selectedProject) {
      addTab({ workflowId: id, projectId: selectedProject.id, projectName: selectedProject.name, workflowName: wf.name })
    }
    silentNavigate({ projectId: selectedProject?.id, workflowId: id })
  }

  const openWorkflowInNewTab = (id: string) => {
    const url = new URL(window.location.origin)
    url.pathname = '/projects'
    url.searchParams.set('projectId', selectedProject?.id || '')
    url.searchParams.set('workflowId', id)
    window.open(url.toString(), '_blank')
  }

  const handleCreateBlank = async () => {
    if (!selectedProject) { toast.error('请先选择项目'); return }
    setCreating(true)
    try {
      const id = await addWorkflow({ projectId: selectedProject.id, name: blankForm.name.trim() || '未命名工作流', description: blankForm.description, category: blankForm.category, tags: blankForm.tags.join(',') })
      toast.success('工作流已创建'); setBlankOpen(false); setBlankForm({ name: '', description: '', category: '', tags: [] }); openWorkflow(id)
    } catch { toast.error('创建失败') } finally { setCreating(false) }
  }

  const handleCreateFromTemplate = async () => {
    if (!selectedProject) { toast.error('请先选择项目'); return }
    if (!selectedTemplate) { toast.error('请选择模板'); return }
    setCreating(true)
    try {
      const id = await createWorkflowFromTemplate({ projectId: selectedProject.id, templateId: selectedTemplate.id, name: `${selectedTemplate.name} 副本`, description: selectedTemplate.description })
      toast.success('已从模板创建'); setTemplateOpen(false); openWorkflow(id)
    } catch { toast.error('创建失败') } finally { setCreating(false) }
  }

  const handleCreateKbPipeline = async () => {
    if (!selectedProject) { toast.error('请先选择项目'); return }
    setCreating(true)
    try {
      const id = await addWorkflow({ projectId: selectedProject.id, name: '知识库入库流水线', description: '自动加载文档、提取元数据、语义分块并入库', category: '知识库' })
      setTemplateOpen(false)
      // 先打开工作流，等加载完成后再注入知识库节点
      addTab({ workflowId: id, projectId: selectedProject.id, projectName: selectedProject.name, workflowName: '知识库入库流水线' })
      silentNavigate({ projectId: selectedProject.id, workflowId: id })
      // 延迟加载知识库流水线（等待工作流数据初始化）
      setTimeout(() => { loadKnowledgePipeline() }, 300)
      toast.success('知识库入库流水线已创建')
    } catch { toast.error('创建失败') } finally { setCreating(false) }
  }

  const handleDeleteWorkflow = async () => {
    if (!workflowToDelete) return
    try { await deleteWorkflow(workflowToDelete.id); toast.success('已删除'); setWorkflowToDelete(null); void reloadWorkflows() }
    catch { toast.error('删除失败') }
  }

  const handleOpenEdit = (wf: WorkflowSummary) => {
    setEditForm({ id: wf.id, name: wf.name, description: wf.description ?? '', category: wf.category ?? '', tags: wf.tags ?? [] })
    setEditOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editForm.name.trim()) { toast.error('名称不能为空'); return }
    setSaving(true)
    try { await updateWorkflow({ id: editForm.id, name: editForm.name.trim(), description: editForm.description, category: editForm.category, tags: editForm.tags.join(',') }); toast.success('已更新'); setEditOpen(false); void reloadWorkflows() }
    catch { toast.error('更新失败') } finally { setSaving(false) }
  }

  // 静默更新 URL（不触发 React 重新渲染）
  const silentNavigate = (params: { projectId?: string; workflowId?: string; mode?: string }) => {
    const url = new URL(window.location.origin)
    url.pathname = '/projects'
    if (params.projectId) url.searchParams.set('projectId', params.projectId)
    if (params.workflowId) url.searchParams.set('workflowId', params.workflowId)
    if (params.mode) url.searchParams.set('mode', params.mode)
    window.history.replaceState(null, '', url.toString())
  }

  const handleSelectProject = (p: FlowProject) => {
    setSelectedProject(p); setCurrentProject(p)
    setActiveTab(null)
    silentNavigate({ projectId: p.id })
  }

  const handleOpenProjectEdit = (e: React.MouseEvent, p: FlowProject) => {
    e.stopPropagation()
    setProjectEditForm({ id: p.id, name: p.name, description: p.description ?? '', scenario: p.scenario ?? '' })
    setProjectEditOpen(true)
  }

  const handleSaveProjectEdit = async () => {
    if (!projectEditForm.name.trim()) { toast.error('项目名称不能为空'); return }
    setProjectSaving(true)
    try { await updateProject({ id: projectEditForm.id, name: projectEditForm.name.trim(), description: projectEditForm.description, scenario: projectEditForm.scenario }); toast.success('项目已更新'); setProjectEditOpen(false); void reloadProjects() }
    catch { toast.error('更新失败') } finally { setProjectSaving(false) }
  }

  // 标签页操作
  const handleTabClick = (tabWorkflowId: string, tabProjectId: string) => {
    setActiveTab(tabWorkflowId)
    silentNavigate({ projectId: tabProjectId, workflowId: tabWorkflowId })
  }

  const handleProjectsTabClick = () => {
    setActiveTab(null)
    silentNavigate({ projectId: selectedProject?.id })
  }

  const handleCloseTab = (e: React.MouseEvent, tabWorkflowId: string) => {
    e.stopPropagation()
    removeTab(tabWorkflowId)
    if (tabWorkflowId === activeTabId) {
      const remaining = tabs.filter((t) => t.workflowId !== tabWorkflowId)
      if (remaining.length > 0) {
        const next = remaining[0]
        setActiveTab(next.workflowId)
        silentNavigate({ projectId: next.projectId, workflowId: next.workflowId })
      } else {
        setActiveTab(null)
        silentNavigate({ projectId: selectedProject?.id })
      }
    }
  }

  const handleTabChange = (value: string) => {
    setOpen(value === 'debug')
    silentNavigate({ projectId: selectedProject?.id, workflowId: activeTabId || undefined, mode: value === 'debug' ? 'debug' : 'edit' })
  }

  return (
    <div className='flex flex-col h-full'>
      {/* ===== 标签页栏 ===== */}
      <div className='flex items-center border-b bg-muted/30 overflow-x-auto no-scrollbar shrink-0'>
        {/* 固定标签：项目空间 */}
        <div
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-xs cursor-pointer border-r shrink-0 transition-colors',
            currentView === 'projects' ? 'bg-background text-foreground border-b-2 border-b-primary' : 'text-muted-foreground hover:bg-muted/50'
          )}
          onClick={handleProjectsTabClick}
        >
          <FolderKanban className='size-3' />
          <span>项目空间</span>
        </div>

        {/* 工作流标签 */}
        {tabs.map((tab) => {
          const isActive = tab.workflowId === activeTabId
          return (
            <div
              key={tab.workflowId}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs cursor-pointer border-r shrink-0 transition-colors group',
                isActive ? 'bg-background text-foreground border-b-2 border-b-primary' : 'text-muted-foreground hover:bg-muted/50'
              )}
              onClick={() => handleTabClick(tab.workflowId, tab.projectId)}
            >
              <span className='truncate max-w-[120px]'>{tab.workflowName}</span>
              {tab.projectName && <span className='text-[9px] text-muted-foreground shrink-0'>· {tab.projectName}</span>}
              <button className='size-3.5 rounded-sm opacity-0 group-hover:opacity-100 hover:bg-muted-foreground/20 transition-opacity flex items-center justify-center shrink-0' onClick={(e) => handleCloseTab(e, tab.workflowId)}>
                <X className='size-2.5' />
              </button>
            </div>
          )
        })}
      </div>

      {/* ===== 内容区 ===== */}
      {currentView === 'projects' ? (
        /* ===== 项目空间视图 ===== */
        <div className='flex-1 overflow-auto p-4'>
          <div className='flex flex-col gap-3'>
            <div className='flex items-center justify-between gap-2'>
              <div className='flex items-center gap-2'>
                <h1 className='text-2xl font-bold tracking-tight'>项目空间</h1>
                <Badge variant='secondary'>Workspace</Badge>
              </div>
              <div className='flex gap-2'>
                <Button variant='outline' size='sm' onClick={reloadProjects} disabled={projectLoading}>
                  <RefreshCw className={cn('mr-1.5 size-4', projectLoading && 'animate-spin')} />刷新
                </Button>
                <Button size='sm' onClick={() => setDialogOpen(true)}>
                  <Plus size={18} className='mr-1.5' />新建项目
                </Button>
              </div>
            </div>
            <Separator className='shadow-sm' />

            <div className='flex gap-4 min-h-0'>
              {/* 左侧：项目列表 */}
              <div className='w-56 shrink-0 flex flex-col gap-2'>
                <div className='flex items-center gap-2 rounded-md border bg-muted/30 px-2'>
                  <Search className='size-3.5 text-muted-foreground shrink-0' />
                  <Input className='h-7 border-0 bg-transparent px-0 text-xs shadow-none focus-visible:ring-0' value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder='搜索项目' />
                </div>
                <div className='flex-1 overflow-auto space-y-0.5'>
                  {projectLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (<div key={i} className='rounded-md border p-2'><Skeleton className='h-3 w-20 mb-1' /><Skeleton className='h-2.5 w-full' /></div>))
                  ) : filteredProjects.length === 0 ? (
                    <div className='rounded-md border border-dashed py-6 text-center'>
                      <FolderKanban className='size-5 text-muted-foreground mx-auto mb-1' />
                      <p className='text-xs text-muted-foreground'>暂无项目</p>
                      <Button size='sm' variant='link' onClick={() => setDialogOpen(true)} className='mt-1 h-auto p-0 text-xs'><Plus className='mr-0.5 size-3' />新建项目</Button>
                    </div>
                  ) : (
                    filteredProjects.map((project) => (
                      <div key={project.id} className={cn('cursor-pointer rounded-md border p-2 transition-colors group', selectedProject?.id === project.id ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-muted/50')} onClick={() => handleSelectProject(project)}>
                        <div className='flex items-center justify-between gap-1'>
                          <div className='flex items-center gap-1.5 min-w-0'>
                            <FolderOpen className={cn('size-3.5 shrink-0', selectedProject?.id === project.id ? 'text-primary' : 'text-muted-foreground')} />
                            <span className='text-xs font-medium truncate'>{project.name}</span>
                          </div>
                          <div className='flex items-center gap-0.5 shrink-0'>
                            <Badge variant={project.status === 'active' ? 'default' : 'outline'} className='text-[10px] px-1 py-0'>{project.status === 'active' ? '进行中' : '归档'}</Badge>
                            <Button size='icon' variant='ghost' className='size-5 opacity-0 group-hover:opacity-100 transition-opacity' onClick={(e) => handleOpenProjectEdit(e, project)}><Pencil className='size-2.5' /></Button>
                          </div>
                        </div>
                        <p className='text-[10px] text-muted-foreground line-clamp-1 mt-0.5 pl-5'>{project.description || '暂无描述'}</p>
                        <div className='flex items-center justify-between mt-1 pl-5'>
                          <span className='text-[10px] text-muted-foreground'>{project.workflowCount ?? 0} 工作流</span>
                          <Badge variant='secondary' className='text-[9px] px-1 py-0'>{project.scenario || '通用'}</Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 右侧：工作流列表 */}
              <div className='flex-1 min-w-0 flex flex-col gap-2'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <Layers3 className='size-4 text-muted-foreground' />
                    <span className='text-sm font-medium'>{selectedProject?.name || '选择项目'}</span>
                    <Badge variant='outline' className='text-[10px]'>{workflows.length} 工作流</Badge>
                  </div>
                  {selectedProject && (
                    <div className='flex gap-1.5'>
                      <Button variant='outline' size='sm' onClick={() => setTemplateOpen(true)} className='h-7 text-xs'><Plus className='mr-1 size-3' />从模板创建</Button>
                      <Button size='sm' onClick={() => setBlankOpen(true)} className='h-7 text-xs'><Plus className='mr-1 size-3' />空白工作流</Button>
                    </div>
                  )}
                </div>
                <Separator />
                {!selectedProject ? (
                  <div className='rounded-md border border-dashed py-12 text-center'><FolderKanban className='size-6 text-muted-foreground mx-auto mb-2' /><p className='text-sm text-muted-foreground'>从左侧选择项目查看工作流</p></div>
                ) : workflowLoading ? (
                  <div className='space-y-2'>{Array.from({ length: 3 }).map((_, i) => (<div key={i} className='rounded-md border p-2'><Skeleton className='h-3 w-28 mb-1' /><Skeleton className='h-2.5 w-full' /></div>))}</div>
                ) : workflows.length === 0 ? (
                  <div className='rounded-md border border-dashed py-8 text-center'>
                    <Layers3 className='size-5 text-muted-foreground mx-auto mb-1' /><p className='text-xs text-muted-foreground'>暂无工作流</p>
                    <div className='flex justify-center gap-2 mt-2'>
                      <Button variant='outline' size='sm' onClick={() => setTemplateOpen(true)} className='h-7 text-xs'><Plus className='mr-1 size-3' />从模板创建</Button>
                      <Button size='sm' onClick={() => setBlankOpen(true)} className='h-7 text-xs'><Plus className='mr-1 size-3' />空白工作流</Button>
                    </div>
                  </div>
                ) : (
                  <div className='rounded-md border'>
                    <table className='w-full text-xs'>
                      <thead><tr className='border-b bg-muted/30'>
                        <th className='px-3 py-1.5 text-left font-medium text-muted-foreground'>名称</th>
                        <th className='px-3 py-1.5 text-left font-medium text-muted-foreground w-20'>分类</th>
                        <th className='px-3 py-1.5 text-left font-medium text-muted-foreground w-24'>标签</th>
                        <th className='px-3 py-1.5 text-left font-medium text-muted-foreground w-16'>状态</th>
                        <th className='px-3 py-1.5 text-left font-medium text-muted-foreground w-20'>日期</th>
                        <th className='px-3 py-1.5 text-right font-medium text-muted-foreground w-24'>操作</th>
                      </tr></thead>
                      <tbody className='divide-y'>
                        {workflows.map((wf) => (
                          <tr key={wf.id} className='hover:bg-muted/30 transition-colors cursor-pointer' onClick={() => openWorkflow(wf.id)}>
                            <td className='px-3 py-2'><div className='font-medium truncate'>{wf.name}</div>{wf.description && <div className='text-[10px] text-muted-foreground truncate mt-0.5'>{wf.description}</div>}</td>
                            <td className='px-3 py-2'>{wf.category ? <Badge variant='outline' className='text-[10px] px-1 py-0'><FolderKanban className='mr-0.5 size-2.5' />{wf.category}</Badge> : <span className='text-muted-foreground'>-</span>}</td>
                            <td className='px-3 py-2'><div className='flex flex-wrap gap-0.5'>{wf.tags?.slice(0, 2).map((tag) => (<Badge key={tag} variant='secondary' className='text-[10px] px-1 py-0'>{tag}</Badge>))}{wf.tags && wf.tags.length > 2 && (<Badge variant='outline' className='text-[10px] px-1 py-0'>+{wf.tags.length - 2}</Badge>)}</div></td>
                            <td className='px-3 py-2'><Badge variant={wf.status === 'active' ? 'default' : 'outline'} className='text-[10px] px-1 py-0'>{wf.status === 'draft' ? '草稿' : wf.status === 'active' ? '运行中' : '归档'}</Badge></td>
                            <td className='px-3 py-2 text-[10px] text-muted-foreground whitespace-nowrap'>{wf.createTime ? new Date(wf.createTime).toLocaleDateString() : '-'}</td>
                            <td className='px-3 py-2' onClick={(e) => e.stopPropagation()}>
                              <div className='flex items-center justify-end gap-0.5'>
                                <Tooltip><TooltipTrigger asChild><Button size='icon' variant='ghost' className='size-6' onClick={() => handleOpenEdit(wf)}><Pencil className='size-3' /></Button></TooltipTrigger><TooltipContent side='top' className='text-xs'>编辑</TooltipContent></Tooltip>
                                <Tooltip><TooltipTrigger asChild><Button size='icon' variant='ghost' className='size-6' onClick={() => openWorkflowInNewTab(wf.id)}><ExternalLink className='size-3' /></Button></TooltipTrigger><TooltipContent side='top' className='text-xs'>新标签页</TooltipContent></Tooltip>
                                <Tooltip><TooltipTrigger asChild><Button size='icon' variant='ghost' className='size-6' onClick={() => setWorkflowToDelete(wf)}><Trash2 className='size-3 text-destructive' /></Button></TooltipTrigger><TooltipContent side='top' className='text-xs'>删除</TooltipContent></Tooltip>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ===== 工作流编辑器视图 ===== */
        <Tabs value={debugOpen ? 'debug' : 'editor'} onValueChange={handleTabChange} className='flex min-h-0 flex-1 flex-col overflow-hidden bg-background'>
          <div className='flex shrink-0 items-center justify-between gap-3 border-b bg-background px-3 py-1.5'>
            <div className='flex items-center gap-2'>
              <Button size='icon' variant='ghost' className='size-7' onClick={() => setNodePanelOpen((v) => !v)} title={nodePanelOpen ? '收起节点面板' : '展开节点面板'}>
                {nodePanelOpen ? <PanelLeftClose className='size-3.5' /> : <PanelLeftOpen className='size-3.5' />}
              </Button>
              <TabsList className='grid h-7 w-[14rem] grid-cols-2'>
                <TabsTrigger value='editor' className='gap-1 text-xs'><MousePointer2 className='size-3' />编辑器</TabsTrigger>
                <TabsTrigger value='debug' className='gap-1 text-xs'><Bot className='size-3' />调试运行</TabsTrigger>
              </TabsList>
            </div>
            <div className='text-[10px] text-muted-foreground'>{tabs.find((t) => t.workflowId === activeTabId)?.workflowName || '工作流'}</div>
          </div>
          <Toolbar projectId={selectedProject?.id} workflowId={activeTabId || undefined} />
          <TabsContent value='editor' className='m-0 min-h-0 flex-1 overflow-hidden data-[state=inactive]:hidden'>
            <div className='flex h-full min-h-0 overflow-hidden'>
              {nodePanelOpen && <NodePanel onDragStart={onDragStart} />}
              <FlowCanvas />
              <PropertyPanel />
            </div>
          </TabsContent>
          <TabsContent value='debug' className='m-0 min-h-0 flex-1 overflow-hidden data-[state=inactive]:hidden'>
            <div className='flex h-full min-h-0 flex-col overflow-hidden'><WorkflowDebugPanel /></div>
          </TabsContent>
        </Tabs>
      )}

      {/* ===== 弹窗 ===== */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader><DialogTitle>新建项目</DialogTitle><DialogDescription>创建独立的工作流空间</DialogDescription></DialogHeader>
          <div className='flex flex-col gap-3'>
            <div className='flex flex-col gap-1.5'><Label>项目名称</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder='输入名称' /></div>
            <div className='flex flex-col gap-1.5'><Label>使用场景</Label><Input value={form.scenario} onChange={(e) => setForm({ ...form, scenario: e.target.value })} placeholder='如：内容生产' /></div>
            <div className='flex flex-col gap-1.5'><Label>描述</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder='说明项目用途' /></div>
          </div>
          <DialogFooter><Button variant='outline' onClick={() => setDialogOpen(false)}>取消</Button><Button onClick={handleCreate} disabled={creating}>{creating ? '创建中...' : '创建项目'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={projectEditOpen} onOpenChange={setProjectEditOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader><DialogTitle>编辑项目</DialogTitle><DialogDescription>修改项目信息</DialogDescription></DialogHeader>
          <div className='flex flex-col gap-3'>
            <div className='flex flex-col gap-1.5'><Label>项目名称</Label><Input value={projectEditForm.name} onChange={(e) => setProjectEditForm({ ...projectEditForm, name: e.target.value })} /></div>
            <div className='flex flex-col gap-1.5'><Label>使用场景</Label><Input value={projectEditForm.scenario} onChange={(e) => setProjectEditForm({ ...projectEditForm, scenario: e.target.value })} /></div>
            <div className='flex flex-col gap-1.5'><Label>描述</Label><Textarea value={projectEditForm.description} onChange={(e) => setProjectEditForm({ ...projectEditForm, description: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant='outline' onClick={() => setProjectEditOpen(false)}>取消</Button><Button onClick={handleSaveProjectEdit} disabled={projectSaving}>{projectSaving ? '保存中...' : '保存'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={blankOpen} onOpenChange={setBlankOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader><DialogTitle>创建空白工作流</DialogTitle><DialogDescription>创建后进入编辑器</DialogDescription></DialogHeader>
          <div className='flex flex-col gap-3'>
            <div className='flex flex-col gap-1.5'><Label>工作流名称</Label><Input value={blankForm.name} onChange={(e) => setBlankForm({ ...blankForm, name: e.target.value })} placeholder='输入名称' /></div>
            <div className='flex flex-col gap-1.5'><Label>描述</Label><Textarea value={blankForm.description} onChange={(e) => setBlankForm({ ...blankForm, description: e.target.value })} placeholder='说明用途' /></div>
            <div className='flex flex-col gap-1.5'><Label>分类</Label><Combobox mode='single' value={blankForm.category} options={categoryOptions} placeholder='选择分类' searchPlaceholder='搜索...' emptyText='无匹配' allowCreate onChange={(v) => setBlankForm({ ...blankForm, category: v })} /></div>
            <div className='flex flex-col gap-1.5'><Label>标签</Label><Combobox mode='multi' value={blankForm.tags} options={tagOptions} placeholder='添加标签' searchPlaceholder='搜索...' emptyText='无匹配' allowCreate onChange={(v) => setBlankForm({ ...blankForm, tags: v })} /></div>
          </div>
          <DialogFooter><Button variant='outline' onClick={() => setBlankOpen(false)}>取消</Button><Button onClick={handleCreateBlank} disabled={creating}>{creating ? '创建中...' : '创建并打开'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={templateOpen} onOpenChange={(open) => { setTemplateOpen(open); if (!open) { setKbTemplateSelected(false); setSelectedTemplateId('') } }}>
        <DialogContent className='flex h-[70vh] max-h-[80vh] flex-col sm:max-w-3xl'>
          <DialogHeader><DialogTitle>从模板创建工作流</DialogTitle><DialogDescription>选择分类和模板</DialogDescription></DialogHeader>
          <div className='flex min-h-0 flex-1 gap-3 overflow-hidden'>
            <div className='flex w-36 shrink-0 flex-col border-r pr-2'>
              <nav className='flex-1 space-y-0.5 overflow-auto'>
                <button type='button' className={cn('flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-xs transition', selectedCategory === 'quick' ? 'bg-primary/10 font-medium text-primary' : 'text-muted-foreground hover:bg-muted/60')} onClick={() => setSelectedCategory('quick')}>
                  <Plus className='size-3' /><span className='flex-1'>快速创建</span><Badge variant='outline' className='text-[9px]'>{templateWorkflows.length + 1}</Badge>
                </button>
                {templateCategories.length > 0 && <Separator className='my-1' />}
                {templateCategories.map(([cat, items]) => (
                  <button key={cat} type='button' className={cn('flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-xs transition', selectedCategory === cat ? 'bg-primary/10 font-medium text-primary' : 'text-muted-foreground hover:bg-muted/60')} onClick={() => setSelectedCategory(cat)}>
                    <Layers3 className='size-3' /><span className='flex-1 truncate'>{cat}</span><Badge variant='outline' className='text-[9px]'>{items.length}</Badge>
                  </button>
                ))}
              </nav>
            </div>
            <div className='flex min-w-0 flex-1 flex-col overflow-hidden'>
              <div className='mb-2 text-xs font-semibold'>{selectedCategory === 'quick' ? '快速创建' : selectedCategory}</div>
              <div className='flex-1 overflow-auto'>
                {selectedCategory === 'quick' ? (
                  <div className='grid gap-2 sm:grid-cols-2'>
                    {/* 内置：知识库入库流水线 */}
                    <button
                      type='button'
                      className={cn('rounded-md border bg-card p-2.5 text-left text-xs transition hover:border-primary', kbTemplateSelected && 'border-primary bg-muted ring-1 ring-primary')}
                      onClick={() => { setKbTemplateSelected(true); setSelectedTemplateId('') }}
                    >
                      <div className='flex items-center gap-1.5 font-medium'>
                        <Database className='size-3.5 text-purple-500' />
                        知识库入库流水线
                      </div>
                      <p className='text-[10px] text-muted-foreground mt-0.5'>自动加载文档、提取元数据、语义分块并入库</p>
                    </button>
                    {templateWorkflows.map((wf) => (
                      <button key={wf.id} type='button' className={cn('rounded-md border bg-card p-2.5 text-left text-xs transition hover:border-primary', selectedTemplateId === wf.id && 'border-primary bg-muted ring-1 ring-primary')} onClick={() => { setSelectedTemplateId(wf.id); setKbTemplateSelected(false) }}>
                        <div className='font-medium truncate'>{wf.name}</div>
                        <p className='text-[10px] text-muted-foreground mt-0.5'>{wf.description || '-'}</p>
                      </button>
                    ))}
                  </div>
                ) : currentTemplates.length === 0 ? <p className='py-6 text-center text-xs text-muted-foreground'>该分类暂无模板</p> : (
                  <div className='grid gap-2 sm:grid-cols-2'>{currentTemplates.map((t) => (<button key={t.id} type='button' className={cn('rounded-md border bg-card p-2.5 text-left text-xs transition hover:border-primary', selectedTemplateId === t.id && 'border-primary bg-muted ring-1 ring-primary')} onClick={() => { setSelectedTemplateId(t.id); setKbTemplateSelected(false) }}><div className='flex items-center justify-between gap-2'><span className='font-medium truncate'>{t.name}</span><Badge variant='outline' className='text-[9px] shrink-0'>{t.category}</Badge></div><p className='text-[10px] text-muted-foreground mt-0.5 line-clamp-2'>{t.description}</p>{t.tags.length > 0 && (<div className='flex flex-wrap gap-0.5 mt-1.5'>{t.tags.slice(0, 2).map((tag) => (<Badge key={tag} variant='secondary' className='text-[9px]'>{tag}</Badge>))}</div>)}</button>))}</div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setTemplateOpen(false)}>取消</Button>
            {kbTemplateSelected ? (
              <Button onClick={handleCreateKbPipeline} disabled={creating}>{creating ? '创建中...' : '创建知识库流水线'}</Button>
            ) : (
              <Button onClick={handleCreateFromTemplate} disabled={creating || !selectedTemplate}>{creating ? '创建中...' : '使用模板'}</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader><DialogTitle>编辑工作流</DialogTitle><DialogDescription>修改工作流信息</DialogDescription></DialogHeader>
          <div className='flex flex-col gap-3'>
            <div className='flex flex-col gap-1.5'><Label>名称</Label><Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></div>
            <div className='flex flex-col gap-1.5'><Label>描述</Label><Textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} /></div>
            <div className='flex flex-col gap-1.5'><Label>分类</Label><Combobox mode='single' value={editForm.category} options={categoryOptions} placeholder='选择分类' onChange={(v) => setEditForm({ ...editForm, category: v })} /></div>
            <div className='flex flex-col gap-1.5'><Label>标签</Label><Combobox mode='multi' value={editForm.tags} options={tagOptions} placeholder='添加标签' onChange={(v) => setEditForm({ ...editForm, tags: v })} /></div>
          </div>
          <DialogFooter><Button variant='outline' onClick={() => setEditOpen(false)}>取消</Button><Button onClick={handleSaveEdit} disabled={saving || !editForm.name.trim()}>{saving ? '保存中...' : '保存'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!workflowToDelete} onOpenChange={(open) => !open && setWorkflowToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>删除工作流</AlertDialogTitle><AlertDialogDescription>确定删除"{workflowToDelete?.name}"吗？</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>取消</AlertDialogCancel><AlertDialogAction onClick={() => void handleDeleteWorkflow()}>确认删除</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
