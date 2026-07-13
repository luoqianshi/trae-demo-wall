import { useState, useEffect, useRef, useDeferredValue } from 'react'
import { Plus, Search as SearchIcon, Upload, FileText, Trash2, Brain, ChevronDown, ChevronRight, Loader2, CheckCircle2, XCircle, RefreshCw, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Database, Braces, Layers, Clock3, List, Save, Eye, SwitchCamera, Network, Zap, Briefcase, Users, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import DocumentUploadDrawer from './components/DocumentUploadDrawer'
import { MilkdownEditor, type MilkdownEditorHandle } from '@/features/documents/editor/milkdown-editor'
import { knowledgeBaseApi, documentApi, chunkApi, ingestionApi, type KnowledgeBase, type Document, type Chunk, type IngestionMode } from './api/knowledge-api'
import { thinkingModelApi, type ThinkingModelExtractResult } from '@/features/tools/api/tools-api'
import { tagRelationApi, type Tag } from '@/features/tags/api/tag-api'
import { TagSelector } from '@/features/tags/components'
import { taskApi, type Task } from '@/features/task/task-api'
import { getWorkflowTemplate, type WorkflowTemplate } from '@/features/projects/project-api'
import { TableOfContents } from '@/features/documents/editor/table-of-contents'
import { EventView } from './components/EventView'
import { CaseView } from './components/CaseView'
import { EntityView } from './components/EntityView'
import { OpinionView } from './components/OpinionView'

interface KnowledgeBaseDetailPageProps {
  kbId: string
  selectedDocId?: string
  onSelectDoc?: (docId: string | null) => void
}

type DocumentStatusFilter = 'all' | 'pending' | 'parsed' | 'processing' | 'completed' | 'failed'

const DOCUMENT_STATUS_OPTIONS = [
  { value: 'all', label: '全部', icon: Layers },
  { value: 'pending', label: '已上传', icon: Clock3 },
  { value: 'parsed', label: '已解析', icon: FileText },
  { value: 'processing', label: '入库中', icon: Loader2 },
  { value: 'completed', label: '已入库', icon: CheckCircle2 },
  { value: 'failed', label: '失败', icon: XCircle },
] satisfies Array<{ value: DocumentStatusFilter; label: string; icon: typeof FileText }>

const INGESTION_MODE_OPTIONS: Array<{ value: IngestionMode; label: string; description: string }> = [
  { value: 'auto', label: '自动分流', description: '规则判断普通或认知级入库' },
  { value: 'standard', label: '普通 RAG', description: '直接分块和向量化，成本最低' },
  { value: 'deep', label: '认知级 RAG', description: '提取父子 Chunk、新版 metadata jsonb 与 events(SPO)，适合高价值文档' },
  { value: 'event', label: '事件入库', description: 'LLM 提取标准化事件（时间锚点、可信度、影响推演），写入事件表+向量双写' },
  { value: 'case', label: '案例入库', description: 'LLM 提取商业案例（多维标签、防伪可信度、附属物），写入案例表+向量双写' },
  { value: 'thinking-model', label: '思维模型', description: 'LLM 提取工具定义，写入思维模型表（不入 RAG 分块）' },
]

export function KnowledgeBaseDetailPage({ kbId, selectedDocId, onSelectDoc }: KnowledgeBaseDetailPageProps) {
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBase | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<DocumentStatusFilter>('all')
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  // 思维模型预览确认弹窗
  const [tmPreviewOpen, setTmPreviewOpen] = useState(false)
  const [tmPreviewData, setTmPreviewData] = useState<ThinkingModelExtractResult | null>(null)
  const [tmPreviewLoading, setTmPreviewLoading] = useState(false)
  const [tmPreviewSaving, setTmPreviewSaving] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set())
  const [bulkSubmitting, setBulkSubmitting] = useState(false)
  const showBatchIngest = false
  const [docChunks, setDocChunks] = useState<Chunk[]>([])
  const [, setChunksLoading] = useState(false)
  // 任务状态：docId -> task
  const [docTasks, setDocTasks] = useState<Record<string, Task>>({})
  // 左侧面板收缩
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  // 中间区域 Tab: 'docs' | 'graph'
  const [mainTab, setMainTab] = useState<'docs' | 'graph' | 'case' | 'entity' | 'opinion'>('docs')
  const [rightPanelOpen, setRightPanelOpen] = useState(true)
  // 当前编辑中的 markdown 内容
  const [currentMarkdown, setCurrentMarkdown] = useState('')
  const deferredMarkdown = useDeferredValue(currentMarkdown)
  const currentMarkdownRef = useRef('')
  const [savingContent, setSavingContent] = useState(false)
  const [contentDirty, setContentDirty] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  // Dialog 状态
  const [metadataDialogOpen, setMetadataDialogOpen] = useState(false)
  const [chunksDialogOpen, setChunksDialogOpen] = useState(false)
  const [expandedChunks, setExpandedChunks] = useState<Set<string>>(new Set())
  const [renamingDocId, setRenamingDocId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [deletingDoc, setDeletingDoc] = useState<Document | null>(null)
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const editorRef = useRef<MilkdownEditorHandle | null>(null)
  // 文档标签
  const [docTagIds, setDocTagIds] = useState<string[]>([])

  useEffect(() => {
    loadKnowledgeBase()
    loadDocuments()
  }, [kbId])


  const setEditorMarkdown = (markdown: string) => {
    currentMarkdownRef.current = markdown
    setCurrentMarkdown(markdown)
  }

  // 选中文档：同步本地状态与路由参数
  const selectDocument = (doc: Document | null, options?: { syncUrl?: boolean }) => {
    const syncUrl = options?.syncUrl ?? true
    // eslint-disable-next-line no-console
    console.log('[kb-detail] selectDocument', { docId: doc?.id, syncUrl })
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
      autoSaveTimerRef.current = null
    }
    setSelectedDoc(doc)
    setEditorMarkdown(doc?.rawText || '')
    setContentDirty(false)
    setLastSavedAt(null)
    if (syncUrl) onSelectDoc?.(doc?.id ?? null)
  }

  const selectDocumentById = async (docId: string, options?: { syncUrl?: boolean }) => {
    try {
      const fullDoc = await documentApi.get(docId)
      selectDocument(fullDoc, options)
    } catch {
      const fallback = documents.find(doc => doc.id === docId)
      if (fallback) selectDocument(fallback, options)
    }
  }

  // 根据 URL 的 docId 恢复选中（刷新页面直达）
  useEffect(() => {
    if (!selectedDocId) return
    if (selectedDoc?.id === selectedDocId) return
    // eslint-disable-next-line no-console
    console.log('[kb-detail] restore from URL', { selectedDocId, currentDocId: selectedDoc?.id })
    // URL 已携带 docId，恢复时无需再回写 URL，避免与 navigate 形成循环
    selectDocumentById(selectedDocId, { syncUrl: false })
  }, [selectedDocId, selectedDoc?.id])

  // 选中文档时加载 chunks
  useEffect(() => {
    if (selectedDoc?.id) {
      loadChunks(selectedDoc.id)
      // 加载文档标签
      tagRelationApi.listByTarget('document', selectedDoc.id).then((tags) => {
        setDocTagIds(tags.map((t: Tag) => t.id))
      }).catch(() => setDocTagIds([]))
    } else {
      setDocChunks([])
      setDocTagIds([])
    }
  }, [selectedDoc?.id])

  // 轮询运行中的任务
  useEffect(() => {
    const runningTaskIds = Object.values(docTasks).filter(t => t.status === 'pending' || t.status === 'running')
    if (runningTaskIds.length === 0) return

    const timer = setInterval(async () => {
      let allDone = true
      const updated: Record<string, Task> = {}
      for (const [docId, task] of Object.entries(docTasks)) {
        if (task.status === 'pending' || task.status === 'running') {
          try {
            const updatedTask = await taskApi.get(task.id)
            updated[docId] = updatedTask
            if (updatedTask.status === 'pending' || updatedTask.status === 'running') {
              allDone = false
            }
            // 任务完成时刷新数据
            if ((updatedTask.status as string) === 'completed' && (task.status as string) !== 'completed') {
              toast.success(`「${docId}」入库完成`)
              loadDocuments()
              loadKnowledgeBase()
              if (selectedDoc?.id === docId) {
                loadChunks(docId)
                documentApi.get(docId).then(setSelectedDoc)
              }
            }
            if ((updatedTask.status as string) === 'failed' && (task.status as string) !== 'failed') {
              toast.error(`入库失败：${updatedTask.errorMessage || '未知错误'}`)
              setDocuments(prev => prev.map(item => item.id === docId ? { ...item, status: 'failed', errorMessage: updatedTask.errorMessage || '入库失败' } : item))
              if (selectedDoc?.id === docId) {
                documentApi.get(docId).then(setSelectedDoc).catch(() => {
                  setSelectedDoc(prev => prev ? { ...prev, status: 'failed', errorMessage: updatedTask.errorMessage || '入库失败' } : prev)
                })
              }
              loadDocuments()
            }
          } catch {
            updated[docId] = task
            allDone = false
          }
        } else {
          updated[docId] = task
        }
      }
      setDocTasks(updated)
      if (allDone) clearInterval(timer)
    }, 2000)

    return () => clearInterval(timer)
  }, [docTasks, selectedDoc?.id])

  const loadKnowledgeBase = async () => {
    try {
      const result = await knowledgeBaseApi.get(kbId)
      setKnowledgeBase(result)
    } catch {
      toast.error('加载知识库失败')
    }
  }

  const loadDocuments = async () => {
    setLoading(true)
    try {
      const result = await documentApi.list({
        kbId,
        searchText: searchQuery || undefined,
        current: 1,
        pageSize: 100,
      })
      setDocuments(result.list)
    } catch {
      toast.error('加载文档失败')
    } finally {
      setLoading(false)
    }
  }

  const loadChunks = async (docId: string) => {
    setChunksLoading(true)
    try {
      const result = await chunkApi.list({ docId, current: 1, pageSize: 100 })
      setDocChunks(result.list)
    } catch {
      setDocChunks([])
    } finally {
      setChunksLoading(false)
    }
  }

  const confirmDeleteDocument = async () => {
    if (!deletingDoc) return
    const docId = deletingDoc.id
    try {
      await documentApi.delete(docId)
      toast.success('文档已删除')
      if (selectedDoc?.id === docId) {
        selectDocument(null)
      }
      loadDocuments()
    } catch {
      toast.error('删除文档失败')
    } finally {
      setDeletingDoc(null)
    }
  }

  const startRenameDocument = (doc: Document) => {
    setRenamingDocId(doc.id)
    setRenameValue(doc.title || '')
  }

  const cancelRenameDocument = () => {
    setRenamingDocId(null)
    setRenameValue('')
  }

  const submitRenameDocument = async (doc: Document) => {
    const nextTitle = renameValue.trim()
    if (!nextTitle || nextTitle === doc.title) {
      cancelRenameDocument()
      return
    }
    try {
      await documentApi.update({ id: doc.id, title: nextTitle })
      setDocuments(prev => prev.map(item => (item.id === doc.id ? { ...item, title: nextTitle } : item)))
      if (selectedDoc?.id === doc.id) {
        setSelectedDoc(prev => (prev ? { ...prev, title: nextTitle } : prev))
      }
      toast.success('重命名成功')
    } catch {
      toast.error('重命名失败')
    } finally {
      cancelRenameDocument()
    }
  }

  const TIERED_RAG_TEMPLATE_ID = 'tpl-tiered-rag-ingestion'
  const COGNITIVE_RAG_TEMPLATE_ID = 'tpl-cognitive-rag-ingestion'

  /** 从工作流模板的 graphJson 中提取模型配置 ID */
  const extractModelConfigFromTemplate = (template: WorkflowTemplate, fieldKey: string): string | undefined => {
    if (!template.graphJson) return undefined
    try {
      const graph = JSON.parse(template.graphJson) as { nodes?: Array<{ data?: { values?: Record<string, unknown>; node?: { values?: Record<string, unknown>; template?: Record<string, { value?: unknown }> } } }> }
      if (!graph.nodes) return undefined
      for (const node of graph.nodes) {
        const values = node.data?.values
        if (values && values[fieldKey] && String(values[fieldKey]).trim()) {
          return String(values[fieldKey])
        }
        const nodeValues = node.data?.node?.values
        if (nodeValues && nodeValues[fieldKey] && String(nodeValues[fieldKey]).trim()) {
          return String(nodeValues[fieldKey])
        }
        const templateField = node.data?.node?.template?.[fieldKey]
        if (templateField && templateField.value != null && String(templateField.value).trim()) {
          return String(templateField.value)
        }
      }
    } catch {
      // 解析失败，忽略
    }
    return undefined
  }

  const loadCognitiveModelConfigId = async () => {
    let modelConfigId: string | undefined
    try {
      const template = await getWorkflowTemplate(TIERED_RAG_TEMPLATE_ID)
      modelConfigId = extractModelConfigFromTemplate(template, 'model_config_id')
    } catch {
      modelConfigId = undefined
    }
    if (modelConfigId) return modelConfigId
    try {
      const template = await getWorkflowTemplate(COGNITIVE_RAG_TEMPLATE_ID)
      return extractModelConfigFromTemplate(template, 'model_config_id')
    } catch {
      return undefined
    }
  }

  const flushCurrentDocumentContent = async (doc: Document, options?: { showToast?: boolean }) => {
    if (selectedDoc?.id !== doc.id) return
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
      autoSaveTimerRef.current = null
    }
    const markdown = editorRef.current?.getMarkdown() ?? currentMarkdownRef.current
    if (markdown.trim() === '' && (selectedDoc?.rawText || '').trim() !== '') {
      throw new Error('当前编辑器内容为空，为避免覆盖已有内容，已取消保存')
    }
    setSavingContent(true)
    try {
      await documentApi.updateContent({ id: doc.id, rawText: markdown })
      setEditorMarkdown(markdown)
      setDocuments(prev => prev.map(item => item.id === doc.id ? { ...item, rawText: markdown } : item))
      setSelectedDoc(prev => prev?.id === doc.id ? { ...prev, rawText: markdown } : prev)
      setContentDirty(false)
      setLastSavedAt(new Date())
      if (options?.showToast) toast.success('已保存')
    } finally {
      setSavingContent(false)
    }
  }

  const handleSaveCurrentDocument = async () => {
    if (!selectedDoc) return
    try {
      await flushCurrentDocumentContent(selectedDoc, { showToast: true })
    } catch (error) {
      toast.error(`保存失败：${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  const submitCognitiveIngest = async (doc: Document, modelConfigId?: string, ingestionMode?: IngestionMode) => {
    const requestedMode = ingestionMode || doc.ingestionMode || 'auto'
    const effectiveMode: IngestionMode = requestedMode === 'none' ? 'auto' : requestedMode
    const task = await ingestionApi.cognitiveIngest(doc.id, modelConfigId, effectiveMode)
    setDocTasks(prev => ({ ...prev, [doc.id]: task }))
    setDocuments(prev => prev.map(item => item.id === doc.id ? { ...item, status: 'processing', ingestionMode: effectiveMode } : item))
    if (selectedDoc?.id === doc.id) {
      setSelectedDoc(prev => prev ? { ...prev, status: 'processing', ingestionMode: effectiveMode } : prev)
    }
    return task
  }

  const handleCognitiveIngest = async (doc: Document) => {
    try {
      const labelMode = doc.ingestionMode === 'none' ? 'auto' : doc.ingestionMode
      toast.info(`正在提交「${doc.title}」的${getIngestionModeLabel(labelMode)}任务...`)
      await flushCurrentDocumentContent(doc)
      const modelConfigId = await loadCognitiveModelConfigId()
      await submitCognitiveIngest(doc, modelConfigId)
      toast.success(doc.status === 'failed' ? '重试任务已提交，可在右上角查看进度' : '任务已提交，可在右上角查看进度')
    } catch (error) {
      toast.error(`提交失败：${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  const handleIngestWithMode = async (doc: Document, ingestionMode: IngestionMode) => {
    try {
      await flushCurrentDocumentContent(doc)

      // 思维模型入库：走「提取→预览→确认」流程
      if (ingestionMode === 'thinking-model') {
        toast.info(`正在提取「${doc.title}」的思维模型...`)
        setTmPreviewLoading(true)
        setTmPreviewOpen(true)
        setTmPreviewData(null)
        try {
          const rawText = doc.rawText || doc.content || ''
          const modelConfigId = await loadCognitiveModelConfigId()
          const result = await thinkingModelApi.extractOnly(doc.id, rawText, modelConfigId)
          setTmPreviewData(result)
          if (!result.isThinkingModel) {
            toast.warning(result.reason || '该文档不包含可提取的思维模型')
          }
        } catch (error) {
          toast.error(`提取失败：${error instanceof Error ? error.message : '未知错误'}`)
          setTmPreviewOpen(false)
        } finally {
          setTmPreviewLoading(false)
        }
        return
      }

      // 其他入库模式：走原有异步任务流程
      toast.info(`正在提交「${doc.title}」的${getIngestionModeLabel(ingestionMode)}任务...`)
      if (ingestionMode !== doc.ingestionMode) {
        try {
          await documentApi.update({ id: doc.id, ingestionMode })
        } catch (error) {
          toast.error(`更新入库模式失败：${error instanceof Error ? error.message : '未知错误'}`)
          return
        }
      }
      const modelConfigId = await loadCognitiveModelConfigId()
      await submitCognitiveIngest(doc, modelConfigId, ingestionMode)
      toast.success('任务已提交，可在右上角查看进度')
    } catch (error) {
      toast.error(`提交失败：${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /** 思维模型确认保存 */
  const handleTmConfirmSave = async () => {
    if (!tmPreviewData?.extractId) return
    setTmPreviewSaving(true)
    try {
      const saved = await thinkingModelApi.confirmSave(tmPreviewData.extractId)
      toast.success(`思维模型「${saved.modelName}」已保存`)
      setTmPreviewOpen(false)
      setTmPreviewData(null)
    } catch (error) {
      toast.error(`保存失败：${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setTmPreviewSaving(false)
    }
  }

  const isDocIngesting = (docId: string) => {
    const task = docTasks[docId]
    return Boolean(task && (task.status === 'pending' || task.status === 'running'))
  }

  const getEffectiveDocumentStatus = (doc: Document): Exclude<DocumentStatusFilter, 'all'> => {
    if (isDocIngesting(doc.id)) return 'processing'
    return doc.status
  }

  const isDocumentProcessing = (doc: Document) => {
    return getEffectiveDocumentStatus(doc) === 'processing'
  }

  const canIngestDocument = (doc: Document) => {
    return !isDocumentProcessing(doc) && (doc.status === 'parsed' || doc.status === 'completed' || doc.status === 'failed')
  }

  const selectedDocuments = documents.filter(doc => selectedDocIds.has(doc.id))
  const ingestibleSelectedDocuments = selectedDocuments.filter(canIngestDocument)

  const toggleDocumentSelection = (docId: string) => {
    setSelectedDocIds(prev => {
      const next = new Set(prev)
      if (next.has(docId)) {
        next.delete(docId)
      } else {
        next.add(docId)
      }
      return next
    })
  }

  const clearDocumentSelection = () => {
    setSelectedDocIds(new Set())
  }

  const handleSelectAllVisible = () => {
    const selectableIds = selectableVisibleDocs.map(doc => doc.id)
    const selectedVisibleCount = selectableIds.filter(id => selectedDocIds.has(id)).length
    setSelectedDocIds(prev => {
      const next = new Set(prev)
      if (selectedVisibleCount === selectableIds.length && selectableIds.length > 0) {
        selectableIds.forEach(id => next.delete(id))
      } else {
        selectableIds.forEach(id => next.add(id))
      }
      return next
    })
  }

  const handleBatchIngest = async () => {
    if (ingestibleSelectedDocuments.length === 0) {
      toast.warning('请选择已解析、已入库或失败的文档')
      return
    }
    setBulkSubmitting(true)
    try {
      const modelConfigId = await loadCognitiveModelConfigId()
      let successCount = 0
      for (const doc of ingestibleSelectedDocuments) {
        try {
          await submitCognitiveIngest(doc, modelConfigId)
          successCount += 1
        } catch (error) {
          toast.error(`「${doc.title}」提交失败：${error instanceof Error ? error.message : '未知错误'}`)
        }
      }
      if (successCount > 0) {
        toast.success(`已提交 ${successCount} 个入库任务`)
      }
    } finally {
      setBulkSubmitting(false)
    }
  }

  const getDocTaskProgress = (docId: string) => {
    const task = docTasks[docId]
    return task?.progress ?? 0
  }

  const getIngestionModeLabel = (mode?: IngestionMode) => {
    if (mode === 'none') return '不入库'
    return INGESTION_MODE_OPTIONS.find(option => option.value === (mode || 'auto'))?.label || '自动分流'
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
      pending: 'secondary',
      parsed: 'outline',
      processing: 'default',
      completed: 'default',
      failed: 'destructive',
    }
    const labels: Record<string, string> = {
      pending: '已上传',
      parsed: '已解析',
      processing: '入库中',
      completed: '已入库',
      failed: '失败',
    }
    return <Badge variant={variants[status] || 'secondary'}>{labels[status] || status}</Badge>
  }

  const toggleChunkExpand = (chunkId: string) => {
    setExpandedChunks((prev) => {
      const next = new Set(prev)
      if (next.has(chunkId)) {
        next.delete(chunkId)
      } else {
        next.add(chunkId)
      }
      return next
    })
  }

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.title?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || getEffectiveDocumentStatus(doc) === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusCount = (status: DocumentStatusFilter) => {
    if (status === 'all') return documents.length
    return documents.filter(doc => getEffectiveDocumentStatus(doc) === status).length
  }

  const visibleDocs = filteredDocs.slice(0, 10)
  const selectableVisibleDocs = visibleDocs.filter(doc => doc.status !== 'completed')
  const visibleSelectedCount = selectableVisibleDocs.filter(doc => selectedDocIds.has(doc.id)).length

  const parseMetadata = (metadataStr?: string): Record<string, unknown> | null => {
    if (!metadataStr) return null
    try {
      return JSON.parse(metadataStr)
    } catch {
      return null
    }
  }

  return (
    <TooltipProvider>
      {/* ===== 紧凑顶栏（一行） ===== */}
      <div className="flex shrink-0 items-center gap-2 border-b px-3 py-1.5">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        >
          {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </Button>
        <span className="truncate text-sm font-semibold">{knowledgeBase?.name || '知识库'}</span>
        <div className="flex-1" />
        {selectedDoc && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => setRightPanelOpen(!rightPanelOpen)}
              >
                {rightPanelOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{rightPanelOpen ? '关闭右侧面板' : '打开右侧面板'}</TooltipContent>
          </Tooltip>
        )}
        <Button onClick={() => setUploadModalOpen(true)} size="sm" className="h-7 px-3 text-xs">
          <Upload size={14} className="mr-1" />
          上传文档
        </Button>


      </div>

      {/* ===== 内容区域（左右分栏） ===== */}
      <div className="faded-bottom no-scrollbar flex flex-1 gap-0 overflow-hidden pb-16">
        {/* 左侧面板：文档列表 */}
        <div className={`flex shrink-0 flex-col border-r transition-all ${sidebarCollapsed ? 'w-0 overflow-hidden border-r-0' : 'w-72'}`}>
          {/* 状态筛选栏 */}
          <div className="flex items-center border-b px-1 py-0.5">
            <div className="flex min-w-0 flex-1 items-center gap-0.5 rounded-md bg-muted/40 p-0.5">
              {DOCUMENT_STATUS_OPTIONS.map((option) => {
                const Icon = option.icon
                const active = statusFilter === option.value
                const count = getStatusCount(option.value)
                return (
                  <Tooltip key={option.value}>
                    <TooltipTrigger asChild>
                      <Button
                        variant={active ? 'default' : 'ghost'}
                        size="icon"
                        className={`relative h-6 w-6 shrink-0 rounded-sm ${!active ? 'text-muted-foreground hover:text-foreground' : ''}`}
                        onClick={() => setStatusFilter(option.value)}
                      >
                        <Icon className={`h-3 w-3 ${option.value === 'processing' && count > 0 ? 'animate-spin' : ''}`} />
                        {count > 0 && (
                          <span className={`absolute -right-0.5 -top-0.5 flex h-3 min-w-3 items-center justify-center rounded-full px-0.5 text-[8px] leading-none ${active ? 'bg-background text-foreground' : 'bg-primary text-primary-foreground'}`}>
                            {count > 99 ? '99+' : count}
                          </span>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      {option.label}：{count}
                    </TooltipContent>
                  </Tooltip>
                )
              })}
              <Separator orientation="vertical" className="mx-0.5 h-4" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-6 w-6 shrink-0 rounded-sm text-muted-foreground hover:text-foreground"
                    onClick={async () => {
                      try {
                        const newDocId = await documentApi.add({ kbId, title: '未命名文档', rawText: '', ingestionMode: 'auto' })
                        // 手动创建的 Markdown 文档无需解析，直接置为已解析状态
                        await documentApi.update({ id: newDocId, status: 'parsed' })
                        await loadDocuments()
                        const newDoc = await documentApi.get(newDocId)
                        selectDocument(newDoc)
                      } catch {
                        toast.error('创建文档失败')
                      }
                    }}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">新建 Markdown 文档</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {!sidebarCollapsed && (
            <>
              {/* ===== 文档列表 ===== */}
              <div className="mb-2 space-y-1 border-b px-2 py-1.5">
                <div className="relative">
                  <SearchIcon className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="搜索文档..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-7 pl-7 text-xs"
                  />
                </div>
                {showBatchIngest && (
                  <div className="flex items-center justify-between gap-1 rounded bg-muted/30 px-1.5 py-1">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <Checkbox
                        checked={selectableVisibleDocs.length > 0 && visibleSelectedCount === selectableVisibleDocs.length}
                        onCheckedChange={handleSelectAllVisible}
                        aria-label="选择当前列表文档"
                        className="h-3 w-3"
                      />
                      <span className="truncate text-[10px] text-muted-foreground">
                        已选{selectedDocIds.size} 可入库{ingestibleSelectedDocuments.length}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5">
                      {selectedDocIds.size > 0 && (
                        <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[10px]" onClick={clearDocumentSelection}>
                          清空
                        </Button>
                      )}
                      <Button
                        size="sm"
                        className="h-5 px-1.5 text-[10px]"
                        disabled={bulkSubmitting || ingestibleSelectedDocuments.length === 0}
                        onClick={handleBatchIngest}
                      >
                        {bulkSubmitting ? <Loader2 className="mr-0.5 h-2.5 w-2.5 animate-spin" /> : <Brain className="mr-0.5 h-2.5 w-2.5" />}
                        批量入库
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              <ScrollArea className="flex-1 [&>div>div]:!block [&>div>div]:!w-full">
                <div className="w-full min-w-0 px-2 pb-4">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                  ) : filteredDocs.length === 0 ? (
                    <div className="py-8 text-center">
                      <FileText className="mx-auto h-8 w-8 text-muted-foreground/50" />
                      <p className="mt-2 text-sm text-muted-foreground">{documents.length === 0 ? '暂无文档' : '没有匹配的文档'}</p>
                      <Button
                        variant="link"
                        size="sm"
                        className="mt-1"
                        onClick={() => setUploadModalOpen(true)}
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        上传文档
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      {visibleDocs.map((doc) => (
                        <div
                          key={doc.id}
                          className={`group relative flex min-w-0 items-center gap-1.5 rounded-md px-2 py-1.5 pr-11 text-sm transition-colors hover:bg-muted ${
                            selectedDoc?.id === doc.id ? 'bg-muted font-medium' : ''
                          }`}
                        >
                          {doc.status !== 'completed' && (
                            <Checkbox
                              checked={selectedDocIds.has(doc.id)}
                              onCheckedChange={() => toggleDocumentSelection(doc.id)}
                              onClick={(event) => event.stopPropagation()}
                              aria-label={`选择文档 ${doc.title}`}
                              className="shrink-0"
                            />
                          )}
                          {/* 状态图标 */}
                          {isDocumentProcessing(doc) ? (
                            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-primary" />
                          ) : doc.status === 'completed' ? (
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
                          ) : doc.status === 'failed' ? (
                            <XCircle className="h-3.5 w-3.5 shrink-0 text-destructive" />
                          ) : (
                            <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          )}
                          {/* 文档名（点击选中，双击重命名） */}
                          {renamingDocId === doc.id ? (
                            <Input
                              autoFocus
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              onBlur={() => submitRenameDocument(doc)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  submitRenameDocument(doc)
                                } else if (e.key === 'Escape') {
                                  e.preventDefault()
                                  cancelRenameDocument()
                                }
                              }}
                              className="h-6 min-w-0 flex-1 px-1.5 text-sm"
                            />
                          ) : (
                            <span
                              className="min-w-0 flex-1 cursor-pointer truncate"
                              onClick={() => selectDocumentById(doc.id)}
                              onDoubleClick={(e) => {
                                e.stopPropagation()
                                startRenameDocument(doc)
                              }}
                              title={`${doc.title}（双击重命名）`}
                            >
                              {doc.title}
                            </span>
                          )}
                          {doc.ingestionMode === 'none' && doc.status !== 'completed' && (
                            <Badge variant="outline" className="shrink-0 border-muted-foreground/30 px-1 py-0 text-[10px] text-muted-foreground">
                              不入库
                            </Badge>
                          )}
                          <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center gap-0 rounded-md bg-background/90 opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setDeletingDoc(doc)
                                  }}
                                >
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>删除文档</TooltipContent>
                            </Tooltip>
                          </div>
                          {/* 入库进度条 */}
                          {isDocumentProcessing(doc) && (
                            <Progress value={getDocTaskProgress(doc.id)} className="h-1 w-10 shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </>
          )}
        </div>
        <div className="relative flex flex-1 flex-col overflow-hidden">
          {/* 文档编辑器 */}
          {selectedDoc ? (
            <>
              {/* 状态 badge + 操作按钮：绝对定位到 TopBar 右侧 */}
              <div className="absolute right-2 top-0 z-20 flex h-[38px] items-center gap-1.5">
                <div className="hidden items-center text-[10px] text-muted-foreground sm:flex">
                  {savingContent ? '保存中...' : contentDirty ? '未保存' : lastSavedAt ? '已保存' : ''}
                </div>
                <Button
                  variant={contentDirty ? 'default' : 'outline'}
                  size="sm"
                  className="h-6 px-2 text-[11px]"
                  disabled={savingContent}
                  onClick={handleSaveCurrentDocument}
                >
                  {savingContent ? <Loader2 size={12} className="mr-0.5 animate-spin" /> : <Save size={12} className="mr-0.5" />}
                  保存
                </Button>
                {getStatusBadge(getEffectiveDocumentStatus(selectedDoc))}
                {selectedDoc.chunkCount != null && selectedDoc.chunkCount > 0 && (
                  <Badge variant="outline" className="text-[10px] px-1 py-0">{selectedDoc.chunkCount} Chunks</Badge>
                )}
                <Badge
                  variant={selectedDoc.ingestionMode === 'none' ? 'outline' : 'secondary'}
                  className={selectedDoc.ingestionMode === 'none'
                    ? 'border-muted-foreground/30 px-1 py-0 text-[10px] text-muted-foreground'
                    : 'text-[10px] px-1 py-0'}
                >
                  {getIngestionModeLabel(selectedDoc.ingestionMode)}
                </Badge>
                {selectedDoc.globalMetadata && (
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px]" onClick={() => setMetadataDialogOpen(true)}>
                    <Braces size={12} className="mr-0.5" />元数据
                  </Button>
                )}
                {docChunks.length > 0 && (
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px]" onClick={() => setChunksDialogOpen(true)}>
                    <Database size={12} className="mr-0.5" />分块({docChunks.length})
                  </Button>
                )}
                {isDocumentProcessing(selectedDoc) ? (
                  <Button size="sm" variant="outline" disabled className="h-6 px-2 text-[11px]">
                    <Loader2 size={12} className="mr-0.5 animate-spin" />入库中 {getDocTaskProgress(selectedDoc.id)}%
                  </Button>
                ) : selectedDoc.status === 'pending' ? (
                  <Button size="sm" disabled className="h-6 px-2 text-[11px]">
                    <FileText size={12} className="mr-0.5" />等待解析
                  </Button>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant={selectedDoc.status === 'completed' ? 'ghost' : 'default'}
                        className="h-6 px-2 text-[11px]"
                        disabled={!canIngestDocument(selectedDoc)}
                      >
                        {selectedDoc.status === 'failed' ? (
                          <RefreshCw size={12} className="mr-0.5" />
                        ) : selectedDoc.status === 'completed' ? (
                          <RefreshCw size={12} className="mr-0.5" />
                        ) : (
                          <Brain size={12} className="mr-0.5" />
                        )}
                        {selectedDoc.status === 'failed' ? '重试' : selectedDoc.status === 'completed' ? '重新入库' : '入库'}
                        <ChevronDown size={10} className="ml-0.5 opacity-70" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>选择入库方式</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {INGESTION_MODE_OPTIONS.map(option => (
                        <DropdownMenuItem
                          key={option.value}
                          onSelect={() => handleIngestWithMode(selectedDoc, option.value)}
                          className="flex flex-col items-start gap-0.5"
                        >
                          <span className="flex items-center gap-1.5 text-sm font-medium">
                            {option.label}
                            {selectedDoc.ingestionMode === option.value && (
                              <Badge variant="secondary" className="px-1 py-0 text-[10px]">当前</Badge>
                            )}
                          </span>
                          <span className="text-xs text-muted-foreground">{option.description}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                {isDocumentProcessing(selectedDoc) && (
                  <Progress value={getDocTaskProgress(selectedDoc.id)} className="h-1.5 w-16" />
                )}
              </div>
              {selectedDoc.status === 'failed' && selectedDoc.errorMessage && (
                <div className="absolute left-2 top-8 z-20 rounded border border-destructive/30 bg-background/90 px-2 py-0.5 text-[10px] text-destructive">
                  入库失败：{selectedDoc.errorMessage}
                </div>
              )}

              {/* 文档/知识图谱 Tab 切换栏 */}
              <div className="shrink-0 border-b px-3 py-1 flex items-center gap-2">
                <Button
                  variant={mainTab === 'docs' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-6 px-2 text-[11px]"
                  onClick={() => setMainTab('docs')}
                >
                  <FileText size={12} className="mr-1" />文档
                </Button>
                <Button
                  variant={mainTab === 'graph' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-6 px-2 text-[11px]"
                  onClick={() => setMainTab('graph')}
                >
                  <Zap size={12} className="mr-1" />事件追踪
                </Button>
                <Button
                  variant={mainTab === 'case' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-6 px-2 text-[11px]"
                  onClick={() => setMainTab('case')}
                >
                  <Briefcase size={12} className="mr-1" />案例库
                </Button>
                <Button
                  variant={mainTab === 'entity' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-6 px-2 text-[11px]"
                  onClick={() => setMainTab('entity')}
                >
                  <Users size={12} className="mr-1" />实体字典
                </Button>
                <Button
                  variant={mainTab === 'opinion' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-6 px-2 text-[11px]"
                  onClick={() => setMainTab('opinion')}
                >
                  <MessageSquare size={12} className="mr-1" />观点库
                </Button>
                {mainTab === 'docs' && (
                  <div className="flex-1 min-w-0 ml-2">
                    <TagSelector
                      selectedTagIds={docTagIds}
                      onChange={async (newTagIds) => {
                        setDocTagIds(newTagIds)
                        try {
                          await tagRelationApi.bind({
                            tagIds: newTagIds,
                            targetType: 'document',
                            targetId: selectedDoc.id,
                          })
                        } catch {
                          toast.error('保存标签失败')
                        }
                      }}
                    />
                  </div>
                )}
              </div>

              {/* 内容区：文档编辑器 或 知识图谱 */}
              <div className="min-h-0 flex-1 flex overflow-hidden">
                {mainTab === 'graph' ? (
                  /* 知识图谱 */
                  <div className="flex-1 min-h-0 overflow-hidden">
                    <EventView kbId={kbId} />
                  </div>
                ) : mainTab === 'case' ? (
                  <div className="flex-1 min-h-0 overflow-hidden">
                    <CaseView kbId={kbId} />
                  </div>
                ) : mainTab === 'entity' ? (
                  <div className="flex-1 min-h-0 overflow-hidden">
                    <EntityView kbId={kbId} />
                  </div>
                ) : mainTab === 'opinion' ? (
                  <div className="flex-1 min-h-0 overflow-hidden">
                    <OpinionView kbId={kbId} />
                  </div>
                ) : (
                <>
                <div className="min-h-0 flex-1 overflow-auto">
                  <MilkdownEditor
                    ref={editorRef}
                    key={selectedDoc.id}
                    value={selectedDoc.rawText || ''}
                    onError={(error) => toast.error(`Markdown 编辑器加载失败：${error.message || '已切换为只读模式'}`)}
                    onChange={(markdown) => {
                      // eslint-disable-next-line no-console
                      console.log('[kb-detail] editor onChange', { docId: selectedDoc.id, len: markdown.length })
                      setEditorMarkdown(markdown)
                      setContentDirty(true)
                      const docId = selectedDoc.id
                      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
                      autoSaveTimerRef.current = setTimeout(async () => {
                        // eslint-disable-next-line no-console
                        console.log('[kb-detail] autoSave run', { docId })
                        if (markdown.trim() === '' && (selectedDoc.rawText || '').trim() !== '') {
                          toast.error('当前编辑器内容为空，为避免覆盖已有内容，已取消自动保存')
                          return
                        }
                        setSavingContent(true)
                        try {
                          await documentApi.updateContent({ id: docId, rawText: markdown })
                          setDocuments(prev => prev.map(item => item.id === docId ? { ...item, rawText: markdown } : item))
                          setSelectedDoc(prev => prev?.id === docId ? { ...prev, rawText: markdown } : prev)
                          setContentDirty(false)
                          setLastSavedAt(new Date())
                        } catch {
                          toast.error('自动保存失败')
                        } finally {
                          setSavingContent(false)
                        }
                      }, 1000)
                    }}
                  />
                </div>
                {/* 右侧面板 - TOC 大纲 */}
                <div
                  className={`shrink-0 border-l bg-background transition-all duration-200 overflow-hidden ${
                    rightPanelOpen ? 'w-[220px]' : 'w-0 border-l-0'
                  }`}
                >
                  <div className="w-[220px] h-full flex flex-col overflow-hidden">
                    <div className="shrink-0 flex items-center border-b px-1 py-0.5">
                      <span className="text-[11px] font-medium text-muted-foreground px-2">大纲</span>
                      <div className="flex-1" />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-5 text-muted-foreground hover:text-foreground"
                        onClick={() => setRightPanelOpen(false)}
                      >
                        <PanelRightClose className="size-3" />
                      </Button>
                    </div>
                    <div className="flex-1 min-h-0 overflow-hidden">
                      <TableOfContents markdown={deferredMarkdown} />
                    </div>
                  </div>
                </div>
                </>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <FileText className="h-16 w-16 text-muted-foreground/20" />
              <p className="mt-4 text-lg font-medium text-muted-foreground">选择文档查看内容</p>
              <p className="mt-1 text-sm text-muted-foreground/70">从左侧列表选择一个文档进行编辑</p>
            </div>
          )}
        </div>
      </div>

      {/* 全局元数据 Dialog */}
      <Dialog open={metadataDialogOpen} onOpenChange={setMetadataDialogOpen}>
        <DialogContent className="flex h-[85vh] max-h-[85vh] flex-col overflow-hidden sm:max-w-3xl">
          <DialogHeader className="shrink-0">
            <DialogTitle>全局元数据</DialogTitle>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden rounded-lg border bg-indigo-50 p-4 dark:bg-indigo-950/30">
            <pre className="min-h-full whitespace-pre-wrap break-words font-mono text-xs leading-relaxed">
              {selectedDoc?.globalMetadata ? JSON.stringify(parseMetadata(selectedDoc.globalMetadata), null, 2) : ''}
            </pre>
          </div>
        </DialogContent>
      </Dialog>

      {/* Chunks Dialog */}
      <Dialog open={chunksDialogOpen} onOpenChange={setChunksDialogOpen}>
        <DialogContent className="sm:max-w-5xl h-[85vh] flex flex-col overflow-hidden">
          <DialogHeader className="shrink-0">
            <DialogTitle>语义分块 ({docChunks.length})</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="space-y-2 pr-2">
              {docChunks.map((chunk) => {
                const isExpanded = expandedChunks.has(chunk.id)
                const chunkMeta = parseMetadata(chunk.metadata)
                return (
                  <div key={chunk.id} className="rounded-lg border">
                    <div
                      className="flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-muted/50"
                      onClick={() => toggleChunkExpand(chunk.id)}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                      <Badge variant={chunk.chunkLevel === 'parent' ? 'default' : 'secondary'} className="text-xs">
                        {chunk.chunkLevel === 'parent' ? `Parent #${chunk.chunkIndex}` : `#${chunk.chunkIndex}`}
                      </Badge>
                      <span className="flex-1 truncate text-sm">
                        {(chunk.chunkText || '').substring(0, 100) || '无文本内容'}
                        {(chunk.chunkText || '').length > 100 ? '...' : ''}
                      </span>
                      {chunk.embedding && (
                        <Badge variant="outline" className="text-xs">
                          向量
                        </Badge>
                      )}
                    </div>
                    {isExpanded && (
                      <div className="border-t px-3 py-3 space-y-2">
                        <div>
                          <p className="mb-1 text-xs font-medium text-muted-foreground">文本内容</p>
                          <pre className="whitespace-pre-wrap break-words rounded bg-muted/30 p-3 font-mono text-xs leading-relaxed">
                            {chunk.chunkText || '无文本内容'}
                          </pre>
                        </div>
                        {chunkMeta && (
                          <div>
                            <p className="mb-1 text-xs font-medium text-muted-foreground">附加元数据</p>
                            <pre className="whitespace-pre-wrap break-words rounded bg-indigo-50 p-3 font-mono text-xs leading-relaxed dark:bg-indigo-950/30">
                              {JSON.stringify(chunkMeta, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <DocumentUploadDrawer
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        kbId={kbId}
        kbName={knowledgeBase?.name}
        onSuccess={loadDocuments}
      />

      {/* 思维模型预览确认弹窗 */}
      <Dialog open={tmPreviewOpen} onOpenChange={(open) => { if (!open && !tmPreviewSaving) setTmPreviewOpen(false) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="size-5 text-amber-500" />
              思维模型提取结果
            </DialogTitle>
          </DialogHeader>
          {tmPreviewLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">LLM 正在提取思维模型...</span>
            </div>
          ) : tmPreviewData ? (
            tmPreviewData.isThinkingModel && tmPreviewData.preview ? (
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-[80px_1fr] gap-y-2 gap-x-3">
                  <span className="text-muted-foreground">模型名称</span>
                  <span className="font-medium">{tmPreviewData.preview.modelName}</span>
                  <span className="text-muted-foreground">模型ID</span>
                  <span className="font-mono text-xs">{tmPreviewData.preview.modelId}</span>
                  <span className="text-muted-foreground">分类</span>
                  <span>{tmPreviewData.preview.routingCategory}</span>
                  <span className="text-muted-foreground">标签</span>
                  <span>{(() => {
                    const tags = tmPreviewData.preview.tags
                    if (typeof tags === 'string') { try { return JSON.parse(tags).join('、') } catch { return tags } }
                    return Array.isArray(tags) ? tags.join('、') : '-'
                  })()}</span>
                  <span className="text-muted-foreground">工具描述</span>
                  <span>{(() => {
                    const schema = tmPreviewData.preview.toolSchema
                    if (typeof schema === 'string') { try { return JSON.parse(schema).description } catch { return schema } }
                    return schema?.description || '-'
                  })()}</span>
                </div>
                {tmPreviewData.preview.executionPrompt && (
                  <div>
                    <span className="text-muted-foreground">执行提示词</span>
                    <pre className="mt-1 max-h-40 overflow-auto rounded-md bg-muted p-2 text-xs whitespace-pre-wrap">
                      {tmPreviewData.preview.executionPrompt}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center">
                <XCircle className="mx-auto size-10 text-muted-foreground/40" />
                <p className="mt-3 text-muted-foreground">{tmPreviewData.reason || '该文档不包含可提取的思维模型'}</p>
              </div>
            )
          ) : null}
          <DialogFooter>
            {tmPreviewData?.isThinkingModel && tmPreviewData.extractId ? (
              <>
                <Button variant="outline" onClick={() => setTmPreviewOpen(false)} disabled={tmPreviewSaving}>取消</Button>
                <Button onClick={handleTmConfirmSave} disabled={tmPreviewSaving}>
                  {tmPreviewSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
                  确认保存
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setTmPreviewOpen(false)}>关闭</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingDoc} onOpenChange={(open) => { if (!open) setDeletingDoc(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">删除文档</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除文档「{deletingDoc?.title}」吗？此操作不可撤销，文档及其已生成的 Chunk 都将被永久删除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteDocument}
              className="bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/40"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  )
}
