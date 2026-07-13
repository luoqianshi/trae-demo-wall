import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  Background,
  BackgroundVariant,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  SelectionMode,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
  type NodeChange,
  type NodeMouseHandler,
  type NodeTypes,
  type OnNodeDrag,
  applyNodeChanges,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { ChevronDown, ChevronLeft, ChevronRight, FileVideo, FolderOpen, GitBranch, Grid2x2, Image as ImageIcon, Layers, ListTree, Plus, RefreshCw, Ungroup, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { comfyuiApi, parseParams, type ComfyParam, type ComfyWorkflow, type LocalWorkflow, type OutputSlot } from './api/comfyui-api'
import { comfyuiProjectApi, type ComfyProject } from './api/project-api'
import { WorkflowNode, type WorkflowNodeData } from './nodes/WorkflowNode'
import { AssetNode, type AssetNodeData, type AssetParamItem } from './nodes/AssetNode'
import { ArrayNode, type ArrayNodeData, type ArrayMode } from './nodes/ArrayNode'
import { PromptBatchNode, type PromptBatchNodeData } from './nodes/PromptBatchNode'
import { LoopNode, type LoopNodeData, type ParamMapping, type ParamMappingMode } from './nodes/LoopNode'
import { MultiImageOutputNode, type MultiImageOutputNodeData } from './nodes/MultiImageOutputNode'
import { ScilWorkflowNode } from './nodes/ScilWorkflowNode'
import { VideoOutputNode, type VideoOutputNodeData } from './nodes/VideoOutputNode'
import { GroupNode, type GroupNodeData } from './nodes/GroupNode'
import { formatAspectRatio, formatWorkflowName, paramLabel, randomSeed } from './config/nodeMeta'
import { PropertyPanel } from './components/PropertyPanel'
import { AssetPropertyPanel } from './components/AssetPropertyPanel'
import { NodeContextMenu, type ContextMenuState } from './components/NodeContextMenu'
import { ProjectBar } from './components/ProjectBar'
import { ImageEditPanel, type EditVersion } from './components/ImageEditPanel'
import { HelperLinesRenderer } from './components/HelperLines'
import { SelectionOverlay } from './components/SelectionOverlay'
import { getHelperLines } from './utils/helperLines'
import { ProjectIdProvider } from './context/ProjectIdContext'

const nodeTypes: NodeTypes = {
  workflowNode: WorkflowNode,
  assetNode: AssetNode,
  arrayNode: ArrayNode,
  promptBatchNode: PromptBatchNode,
  loopNode: LoopNode,
  multiImageOutputNode: MultiImageOutputNode,
  scilWorkflowNode: ScilWorkflowNode,
  videoOutputNode: VideoOutputNode,
  groupNode: GroupNode,
}

const COMFYUI_LAST_PROJECT_STORAGE_KEY = 'comfyui-last-project-id'

/** 画布多选状态 Context，供节点组件判断是否应显示选中边框 */
const MultiSelectContext = createContext(false)
export const useMultiSelect = () => useContext(MultiSelectContext)

function getStoredComfyProjectId() {
  if (typeof window === 'undefined') return null
  try {
    const value = window.localStorage.getItem(COMFYUI_LAST_PROJECT_STORAGE_KEY)?.trim()
    return value || null
  } catch {
    return null
  }
}

function setStoredComfyProjectId(projectId: string) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(COMFYUI_LAST_PROJECT_STORAGE_KEY, projectId)
  } catch {
    return
  }
}

function removeStoredComfyProjectId() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(COMFYUI_LAST_PROJECT_STORAGE_KEY)
  } catch {
    return
  }
}

type ImageEditState = {
  baselineUrl?: string
  activeUrl?: string
  activeVersionId?: string
  versions?: EditVersion[]
}

function activeEditVersionKey(sourceUrl: string | null) {
  return sourceUrl ?? '__asset__'
}

function getStableImageEditEntry(
  data: AssetNodeData | MultiImageOutputNodeData,
  url: string | null
): { key: string; state?: ImageEditState } {
  const states = imageEditStates(data)
  if (url) {
    const matched = Object.entries(states).find(([key, state]) =>
      key === url || state.baselineUrl === url || state.activeUrl === url || state.versions?.some((version) => version.urls.includes(url))
    )
    if (matched) {
      return { key: matched[0], state: matched[1] }
    }
  }
  const key = activeEditVersionKey(url)
  return { key, state: states[key] }
}

function singleUrlVersion(version: EditVersion, sourceUrl?: string): EditVersion {
  const urls = version.urls.filter((u) => !/_temp_/i.test(u))
  return { ...version, urls: urls.slice(0, 1), sourceUrl }
}

function firstUrl(urls: unknown) {
  return Array.isArray(urls) && typeof urls[0] === 'string' ? urls[0] : undefined
}

function imageEditStates(data: AssetNodeData | MultiImageOutputNodeData): Record<string, ImageEditState> {
  const raw = data.imageEditStates
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return { ...(raw as Record<string, ImageEditState>) }
  }
  return {}
}

function getImageEditState(data: AssetNodeData | MultiImageOutputNodeData, sourceUrl: string | null): ImageEditState {
  const { state } = getStableImageEditEntry(data, sourceUrl)
  if (state) return state
  const versions = ((data.editVersions as EditVersion[] | undefined) ?? []).filter((version) => {
    if (!sourceUrl) return true
    return version.sourceUrl ? version.sourceUrl === sourceUrl : version.urls.includes(sourceUrl)
  })
  if (sourceUrl) {
    return {
      baselineUrl: sourceUrl,
      versions: versions.map((version) => singleUrlVersion(version, sourceUrl)),
    }
  }
  return {
    baselineUrl: firstUrl(data.baselineUrls) ?? firstUrl(data.urls),
    activeVersionId: typeof data.activeVersionId === 'string' ? data.activeVersionId : undefined,
    versions,
  }
}

function isVideoUrl(url: string) {
  const clean = url.split('?')[0].toLowerCase()
  return /\.(mp4|webm|mov|avi|mkv|m4v)$/.test(clean)
}

function serializeGraphSnapshot(
  snapshotNodes: Node[],
  snapshotEdges: Edge[],
  snapshotGroups: Array<{ id: string; label: string; childIds: string[] }>
): string {
  const plainNodes = snapshotNodes.map((n) => {
    if (n.type === 'workflowNode') {
      const d = n.data as WorkflowNodeData
      return {
        id: n.id,
        type: n.type,
        position: n.position,
        data: {
          nodeId: d.nodeId,
          backendId: d.backendId,
          name: d.name,
          outputType: d.outputType,
          params: d.params,
          values: d.values,
        },
      }
    }
    if (n.type === 'assetNode') {
      const d = n.data as AssetNodeData
      return {
        id: n.id,
        type: n.type,
        position: n.position,
        data: {
          name: d.name,
          urls: d.urls,
          displayMode: d.displayMode,
          locked: d.locked,
          elapsedMs: d.elapsedMs,
          prompt: d.prompt,
          aspectRatio: d.aspectRatio,
          params: d.params,
          editVersions: d.editVersions,
          baselineUrls: d.baselineUrls,
          activeVersionId: d.activeVersionId,
          imageEditStates: d.imageEditStates,
        },
      }
    }
    if (n.type === 'groupNode') {
      const d = n.data as GroupNodeData
      return {
        id: n.id,
        type: n.type,
        position: n.position,
        width: n.width,
        height: n.height,
        data: {
          label: d.label,
          groupId: d.groupId,
          childIds: d.childIds,
          width: d.width,
          height: d.height,
        },
      }
    }
    return { id: n.id, type: n.type, position: n.position, data: {} }
  })
  const plainEdges = snapshotEdges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
  }))
  return JSON.stringify({ nodes: plainNodes, edges: plainEdges, groups: snapshotGroups })
}

function ComfyUICanvasInner({ routeProjectId }: { routeProjectId?: string }) {
  const [nodes, setNodes] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [localWorkflows, setLocalWorkflows] = useState<LocalWorkflow[]>([])
  const [importedWorkflows, setImportedWorkflows] = useState<ComfyWorkflow[]>([])
  // 保持一份 ref，供 handleRun 等异步回调按 backendId 快速查工作流（含 outputSlots）
  const importedWorkflowsRef = useRef<ComfyWorkflow[]>([])
  useEffect(() => {
    importedWorkflowsRef.current = importedWorkflows
  }, [importedWorkflows])
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [previewIndex, setPreviewIndex] = useState(0)

  // 键盘左右箭头切换预览图片
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (previewUrls.length <= 1) return
      if (e.key === 'ArrowLeft' && previewIndex > 0) {
        e.preventDefault()
        setPreviewIndex(previewIndex - 1)
      } else if (e.key === 'ArrowRight' && previewIndex < previewUrls.length - 1) {
        e.preventDefault()
        setPreviewIndex(previewIndex + 1)
      } else if (e.key === 'Escape') {
        setPreviewUrls([])
      }
    }
    if (previewUrls.length > 0) {
      window.addEventListener('keydown', handler)
      return () => window.removeEventListener('keydown', handler)
    }
  }, [previewUrls, previewIndex])

  // Ctrl+V 从剪贴板粘贴图片到画布，作为图片输出节点导入
  const handleImportFilesRef = useRef<
    ((files: File[], position: { x: number; y: number }) => void | Promise<void>) | undefined
  >(undefined)
  const screenToFlowPositionRef = useRef<typeof screenToFlowPosition | undefined>(undefined)
  // 追踪鼠标最后所在的屏幕坐标：粘贴时以此为中心创建节点，模拟"在鼠标位置粘贴"
  const lastMousePosRef = useRef<{ x: number; y: number } | null>(null)
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      lastMousePosRef.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('mousemove', onMouseMove)
    return () => window.removeEventListener('mousemove', onMouseMove)
  }, [])
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      // 若焦点在输入类元素上，交给它自己处理（比如提示词输入框粘贴文本）
      const active = document.activeElement as HTMLElement | null
      if (active) {
        const tag = active.tagName
        if (
          tag === 'INPUT' ||
          tag === 'TEXTAREA' ||
          active.isContentEditable ||
          active.closest('[data-slot="dialog-content"]') !== null
        ) {
          return
        }
      }
      const items = e.clipboardData?.items
      if (!items) return
      // Windows 剪贴板同一张图会以多种 MIME（image/png + image/bmp + ...）出现多次，
      // 且每次 getAsFile() 都会返回新的 File 对象（lastModified 不同），无法用 name/size 去重。
      // 剪贴板一次复制本质上只对应一张图，因此只取第一个 image/* 类型的文件。
      let firstFile: File | null = null
      let seenCount = 0
      for (let i = 0; i < items.length; i++) {
        const it = items[i]
        if (it.kind === 'file') {
          const f = it.getAsFile()
          if (f && f.type.startsWith('image/')) {
            seenCount++
            if (!firstFile) firstFile = f
          }
        }
      }
      if (!firstFile) return
      if (seenCount > 1) {
        console.log('[comfyui] 剪贴板包含 %d 份图片副本（同一张的多个 MIME 变体），只导入 1 张', seenCount)
      }
      const files: File[] = [firstFile]
      e.preventDefault()
      // 优先以鼠标最后位置为中心（模拟"在鼠标处粘贴"）；
      // 若鼠标不在画布区域内，退回到 ReactFlow 根容器中心。
      const flowRoot = document.querySelector('.react-flow') as HTMLElement | null
      const rect = flowRoot?.getBoundingClientRect()
      let clientX: number
      let clientY: number
      const mouse = lastMousePosRef.current
      if (
        mouse &&
        rect &&
        mouse.x >= rect.left &&
        mouse.x <= rect.right &&
        mouse.y >= rect.top &&
        mouse.y <= rect.bottom
      ) {
        clientX = mouse.x
        clientY = mouse.y
      } else if (rect) {
        clientX = rect.left + rect.width / 2
        clientY = rect.top + rect.height / 2
      } else {
        clientX = window.innerWidth / 2
        clientY = window.innerHeight / 2
      }
      const s2f = screenToFlowPositionRef.current
      const importer = handleImportFilesRef.current
      // 节点宽 ~280、高 ~200，减去一半让"图片中心"对齐鼠标而不是"节点左上角"
      const rawPosition = s2f ? s2f({ x: clientX, y: clientY }) : { x: 200, y: 160 }
      const position = { x: rawPosition.x - 140, y: rawPosition.y - 100 }
      console.log('[comfyui] paste at flow position:', position, 'client:', { x: clientX, y: clientY })
      if (importer) void importer(files, position)
    }
    document.addEventListener('paste', onPaste)
    return () => document.removeEventListener('paste', onPaste)
  }, [])
  const [helperLines, setHelperLines] = useState<{ horizontal?: number; vertical?: number }>({})
  const [editPanelCollapsed, setEditPanelCollapsed] = useState(true)
  const [workflowListCollapsed, setWorkflowListCollapsed] = useState(false)
  const [pendingEditImage, setPendingEditImage] = useState<{ url: string; assetId: string; assetName?: string } | null>(null)
  const [activeEditAssetId, setActiveEditAssetId] = useState<string | null>(null)
  const [activeEditSourceUrl, setActiveEditSourceUrl] = useState<string | null>(null)
  const activeEditSourceUrlRef = useRef<string | null>(null)

  // 分组状态
  const [groups, setGroups] = useState<Array<{ id: string; label: string; childIds: string[] }>>([])
  // 记录当前选中的多个节点 ID（用于创建分组）
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([])

  const [projects, setProjects] = useState<ComfyProject[]>([])
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null)
  const currentProjectIdRef = useRef<string | null>(null)
  const [currentProjectName, setCurrentProjectName] = useState<string>('')
  const [saving, setSaving] = useState(false)

  const valuesRef = useRef<Record<string, Record<string, unknown>>>({})
  const backendIdRef = useRef<Record<string, string>>({})
  const idCounter = useRef(0)
  const assetNameCounter = useRef(0)
  const edgesRef = useRef<Edge[]>([])
  const nodesRef = useRef<Node[]>([])
  const handleRunPromptBatchRef = useRef<((nodeId: string) => Promise<void>) | null>(null)
  const handleRunLoopRef = useRef<((nodeId: string) => Promise<void>) | null>(null)
  const rf = useReactFlow()
  const { screenToFlowPosition } = rf
  const navigate = useNavigate()

  useEffect(() => {
    edgesRef.current = edges
  }, [edges])

  useEffect(() => {
    nodesRef.current = nodes
  }, [nodes])

  const nextId = useCallback((prefix: string) => {
    idCounter.current += 1
    return `${prefix}-${Date.now()}-${idCounter.current}`
  }, [])

  const refreshWorkflows = useCallback(async () => {
    try {
      const local = await comfyuiApi.scan()
      setLocalWorkflows(local)
    } catch (e) {
      toast.error(`加载工作流失败：${e instanceof Error ? e.message : '未知错误'}`)
    }
  }, [])

  const refreshImportedWorkflows = useCallback(async () => {
    try {
      const list = await comfyuiApi.list()
      setImportedWorkflows(list)
    } catch {
      // 静默：图片编辑面板可用工作流为空
    }
  }, [])

  const refreshProjects = useCallback(async () => {
    try {
      const list = await comfyuiProjectApi.list()
      setProjects(list)
      return list
    } catch (e) {
      toast.error(`加载项目失败：${e instanceof Error ? e.message : '未知错误'}`)
      return []
    }
  }, [])

  const saveGraphSnapshot = useCallback(
    async (snapshotNodes: Node[], snapshotEdges: Edge[], snapshotGroups = groups) => {
      if (!currentProjectId) return
      const snapshot = serializeGraphSnapshot(snapshotNodes, snapshotEdges, snapshotGroups)
      await comfyuiProjectApi.save(currentProjectId, snapshot, currentProjectName)
      lastSavedRef.current = snapshot
      void refreshProjects()
    },
    [currentProjectId, currentProjectName, groups, refreshProjects]
  )

  const handleChangeValue = useCallback(
    (nodeId: string, key: string, value: unknown) => {
      const cur = valuesRef.current[nodeId] ?? {}
      cur[key] = value
      valuesRef.current[nodeId] = cur
      setNodes((nds) => {
        const nextNodes = nds.map((n) =>
          n.id === nodeId
            ? { ...n, data: { ...n.data, values: { ...cur } } }
            : n
        )
        if (currentProjectId) {
          const snapshot = serializeGraphSnapshot(nextNodes, edgesRef.current, groups)
          if (snapshot !== lastSavedRef.current) {
            void comfyuiProjectApi.save(currentProjectId, snapshot, currentProjectName).then(() => {
              lastSavedRef.current = snapshot
              void refreshProjects()
            }).catch(() => undefined)
          }
        }
        return nextNodes
      })
    },
    [setNodes, currentProjectId, currentProjectName, groups, refreshProjects]
  )

  const setNodeRunning = useCallback(
    (nodeId: string, running: boolean, percent?: number, stage?: string) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId
            ? {
                ...n,
                data: {
                  ...n.data,
                  running,
                  progress: running ? (percent ?? 0) : null,
                  stage: running ? (stage ?? '') : '',
                },
              }
            : n
        )
      )
    },
    [setNodes]
  )

  const updateArrayNode = useCallback(
    (nodeId: string, patch: Partial<ArrayNodeData>) => {
      setNodes((nds) => nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...patch } } : n)))
    },
    [setNodes]
  )

  const updatePromptBatchNode = useCallback(
    (nodeId: string, patch: Partial<PromptBatchNodeData>) => {
      setNodes((nds) => nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...patch } } : n)))
    },
    [setNodes]
  )

  const updateLoopNode = useCallback(
    (nodeId: string, patch: Partial<LoopNodeData>) => {
      setNodes((nds) => nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...patch } } : n)))
    },
    [setNodes]
  )

  const updateMultiImageOutputNode = useCallback(
    (nodeId: string, patch: Partial<MultiImageOutputNodeData>) => {
      setNodes((nds) => nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...patch } } : n)))
    },
    [setNodes]
  )

  const buildLoopParamOptions = useCallback((params: ComfyParam[]) => {
    return params
      .filter((p) => ['string', 'text', 'number', 'int', 'float', 'image', 'video'].includes(String(p.type).toLowerCase()))
      .map((p) => ({
        key: `${p.nodeId}.${p.paramName}`,
        label: `${p.title || p.nodeType} / ${p.label || p.paramName}`,
        type: p.type,
      }))
  }, [])

  const getDefaultLoopParamKey = useCallback((params: ComfyParam[]) => {
    const options = buildLoopParamOptions(params)
    const preferred = options.find((item) => /prompt|text|正向|提示词/i.test(item.label))
    return preferred?.key ?? options[0]?.key ?? ''
  }, [buildLoopParamOptions])

  const findPositivePromptParam = useCallback((params: ComfyParam[]) => {
    return params.find(
      (p) =>
        p.type === 'string' &&
        (p.nodeType === 'CLIPTextEncode' || p.nodeType === 'PrimitiveStringMultiline') &&
        !/负面|negative/i.test(p.title) &&
        !/负面|negative/i.test(p.label)
    )
  }, [])

  const handleAssetRename = useCallback(
    (assetId: string, name: string) => {
      setNodes((nds) =>
        nds.map((n) => (n.id === assetId ? { ...n, data: { ...n.data, name } } : n))
      )
    },
    [setNodes]
  )

  const handleAssetToggleMode = useCallback(
    (assetId: string) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === assetId
            ? {
                ...n,
                data: {
                  ...n.data,
                  displayMode: n.data.displayMode === 'multi' ? 'single' : 'multi',
                },
              }
            : n
        )
      )
    },
    [setNodes]
  )

  const handleAssetToggleLock = useCallback(
    (assetId: string) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === assetId ? { ...n, data: { ...n.data, locked: !n.data.locked } } : n
        )
      )
    },
    [setNodes]
  )

  const handleAssetEdit = useCallback(
    (assetId: string, url: string) => {
      const assetNode = nodesRef.current.find((n) => n.id === assetId)
      const assetName = (assetNode?.data as AssetNodeData | undefined)?.name
      setPendingEditImage({ url, assetId, assetName })
      setActiveEditAssetId(assetId)
      setActiveEditSourceUrl(url)
      activeEditSourceUrlRef.current = url
      setEditPanelCollapsed(false)
    },
    []
  )

  const handleEditedVersion = useCallback(
    (assetId: string | undefined, version: EditVersion) => {
      const sourceUrl = activeEditSourceUrlRef.current
      if (!assetId) {
        const cleanedVersion = singleUrlVersion(version, sourceUrl ?? undefined)
        toast.success(`编辑完成，共 ${cleanedVersion.urls.length} 张`)
        return
      }
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id !== assetId) return n
          const data = n.data as AssetNodeData
          const states = imageEditStates(data)
          const { key, state } = getStableImageEditEntry(data, sourceUrl)
          const currentState = state ?? getImageEditState(data, sourceUrl)
          const baselineUrl = currentState.baselineUrl ?? sourceUrl ?? firstUrl(data.urls)
          const cleanedVersion = singleUrlVersion(version, baselineUrl)
          const nextState: ImageEditState = {
            baselineUrl,
            activeUrl: currentState.activeUrl ?? sourceUrl ?? baselineUrl,
            activeVersionId: currentState.activeVersionId,
            versions: [cleanedVersion, ...(currentState.versions ?? [])],
          }
          return {
            ...n,
            data: {
              ...data,
              imageEditStates: {
                ...states,
                [key]: nextState,
              },
            },
          }
        })
      )
      const versionUrlCount = firstUrl(version.urls) ? 1 : 0
      toast.success(`新版本已生成（${versionUrlCount} 张），可在版本历史中选择应用`)
    },
    [setNodes]
  )

  const handleSelectAssetVersion = useCallback(
    (assetId: string, versionId: string | undefined) => {
      const sourceUrl = activeEditSourceUrlRef.current
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id !== assetId) return n
          const data = n.data as AssetNodeData
          const states = imageEditStates(data)
          const { key, state } = getStableImageEditEntry(data, sourceUrl)
          const currentState = state ?? getImageEditState(data, sourceUrl)
          const baselineUrl = currentState.baselineUrl ?? sourceUrl
          const selectedVersion = versionId ? currentState.versions?.find((x) => x.id === versionId) : undefined
          const fallbackUrls = versionId ? (selectedVersion?.urls.filter((u) => !/_temp_/i.test(u)) ?? data.urls) : (data.baselineUrls ?? data.urls)
          const replacementUrl = versionId ? firstUrl(selectedVersion?.urls.filter((u) => !/_temp_/i.test(u))) : baselineUrl
          if (!sourceUrl || !replacementUrl) {
            return {
              ...n,
              data: {
                ...data,
                urls: fallbackUrls,
                activeVersionId: versionId,
                imageEditStates: {
                  ...states,
                  [key]: {
                    ...currentState,
                    activeUrl: replacementUrl,
                    activeVersionId: versionId,
                  },
                },
              },
            }
          }
          const source = sourceUrl
          const targetIndex = data.urls.indexOf(source)
          const baselineIndex = typeof baselineUrl === 'string' ? data.urls.indexOf(baselineUrl) : -1
          const replaceIndex = targetIndex >= 0 ? targetIndex : baselineIndex
          if (replaceIndex < 0) return n
          const nextUrls = data.urls.map((url, index) => (index === replaceIndex ? replacementUrl : url))
          return {
            ...n,
            data: {
              ...data,
              urls: nextUrls,
              imageEditStates: {
                ...states,
                [key]: {
                  ...currentState,
                  activeUrl: replacementUrl,
                  activeVersionId: versionId,
                },
              },
            },
          }
        })
      )
    },
    [setNodes]
  )

  const editingAsset = useMemo(() => {
    if (!activeEditAssetId) return undefined
    const node = nodes.find((n) => n.id === activeEditAssetId)
    if (!node || (node.type !== 'assetNode' && node.type !== 'multiImageOutputNode')) return undefined
    const d = node.data as AssetNodeData
    const state = getImageEditState(d, activeEditSourceUrl)
    const baselineUrl = state.baselineUrl ?? activeEditSourceUrl ?? firstUrl(d.baselineUrls) ?? firstUrl(d.urls)
    const versions = (state.versions ?? []).map((version) => singleUrlVersion(version, baselineUrl))
    return {
      id: node.id,
      name: d.name,
      baselineUrls: baselineUrl ? [baselineUrl] : [],
      versions,
      activeVersionId: state.activeVersionId,
    }
  }, [activeEditAssetId, activeEditSourceUrl, nodes])

  const handleAssetRemoveImage = useCallback(
    async (assetId: string, url: string) => {
      try {
        await comfyuiApi.deleteOutputImage(url)
        setNodes((nds) =>
          nds.map((n) => {
            if (n.id !== assetId) return n
            const data = n.data as AssetNodeData
            const nextVersions = ((data.editVersions as EditVersion[] | undefined) ?? []).map((version) => ({
              ...version,
              urls: version.urls.filter((u) => u !== url),
            }))
            return {
              ...n,
              data: {
                ...data,
                urls: data.urls.filter((u) => u !== url),
                baselineUrls: data.baselineUrls?.filter((u) => u !== url),
                editVersions: nextVersions,
              },
            }
          })
        )
        if (previewUrls.includes(url)) setPreviewUrls([])
        toast.success('图片已删除')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : '删除图片失败')
      }
    },
    [previewUrls, setNodes]
  )

  const handleAssetClearAll = useCallback(
    async (assetId: string) => {
      const asset = nodesRef.current.find((n) => n.id === assetId)
      if (!asset) return
      const data = asset.data as AssetNodeData
      const allUrls = Array.from(
        new Set([
          ...(data.urls ?? []),
          ...(data.baselineUrls ?? []),
          ...(((data.editVersions as EditVersion[] | undefined) ?? []).flatMap((v) => v.urls)),
        ])
      )
      await Promise.allSettled(allUrls.map((u) => comfyuiApi.deleteOutputImage(u)))
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id !== assetId) return n
          const d = n.data as AssetNodeData
          return {
            ...n,
            data: {
              ...d,
              urls: [],
              baselineUrls: [],
              editVersions: [],
              imageEditStates: {},
              activeVersionId: undefined,
            },
          }
        })
      )
      setPreviewUrls([])
      toast.success(`已清空 ${allUrls.length} 张素材`)
    },
    [setNodes]
  )

  const handleDeleteNode = useCallback(
    async (nodeId: string) => {
      const nextNodes = nodesRef.current.filter((n) => n.id !== nodeId)
      const nextEdges = edgesRef.current.filter((e) => e.source !== nodeId && e.target !== nodeId)
      setNodes(nextNodes)
      setEdges(nextEdges)
      if (selectedNodeId === nodeId) setSelectedNodeId(null)
      try {
        await saveGraphSnapshot(nextNodes, nextEdges)
      } catch (error) {
        toast.error(`删除已生效，但保存失败：${error instanceof Error ? error.message : '未知错误'}`)
      }
    },
    [setNodes, setEdges, selectedNodeId, saveGraphSnapshot]
  )

  const handleDeleteAssetNode = useCallback(
    async (assetId: string) => {
      const asset = nodesRef.current.find((n) => n.id === assetId)
      if (!asset || asset.type !== 'assetNode') {
        await handleDeleteNode(assetId)
        return
      }
      const data = asset.data as AssetNodeData
      const versionUrls = ((data.editVersions as EditVersion[] | undefined) ?? []).flatMap((version) => version.urls)
      const urls = Array.from(new Set([...(data.urls ?? []), ...(data.baselineUrls ?? []), ...versionUrls]))
      const settled = await Promise.allSettled(urls.map((url) => comfyuiApi.deleteOutputImage(url)))
      const failedCount = settled.filter((result) => result.status === 'rejected').length
      await handleDeleteNode(assetId)
      if (failedCount > 0) {
        toast.warning(`输出节点已删除并保存，${failedCount} 张本地图片删除失败，请确认后端已重启`)
        return
      }
      toast.success(urls.length > 0 ? `已删除输出节点和 ${urls.length} 张本地图片` : '已删除输出节点')
    },
    [handleDeleteNode]
  )

  const lastLoopInputSignatureRef = useRef('')

  const getArrayItems = useCallback((itemsText?: string) => {
    return (itemsText ?? '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
  }, [])

  const refreshLoopInputMeta = useCallback((edgeSource = edgesRef.current) => {
    setNodes((current) => {
      let changed = false
      const next = current.map((node) => {
        if (node.type !== 'loopNode') return node
        const inputEdge = edgeSource.find((e) => e.target === node.id && current.find((n) => n.id === e.source)?.type === 'arrayNode')
        const inputNode = inputEdge ? current.find((n) => n.id === inputEdge.source) : undefined
        const inputData = inputNode?.data as ArrayNodeData | undefined
        const arrayMode = inputData?.arrayMode ?? 'text'
        const textItems = inputData ? getArrayItems(inputData.itemsText) : []
        const tableRows = inputData?.tableRows ?? []
        const inputItems: string[] = arrayMode === 'text'
          ? textItems
          : tableRows.map((row) => Object.entries(row).map(([k, v]) => `${k}: ${v}`).join(', '))
        const inputCount = inputItems.length
        const inputSourceName = inputData?.name
        const inputArrayMode = inputData?.arrayMode ?? 'text'
        const inputArrayFields = inputData?.arrayMode === 'table' ? (inputData?.tableColumns ?? []) : []
        const currentData = node.data as LoopNodeData
        const currentItems = currentData.inputItems ?? []
        const sameItems = currentItems.length === inputItems.length && currentItems.every((item, index) => item === inputItems[index])
        if (currentData.inputCount === inputCount && currentData.inputSourceName === inputSourceName && sameItems && currentData.inputArrayMode === inputArrayMode && JSON.stringify(currentData.inputArrayFields) === JSON.stringify(inputArrayFields)) {
          return node
        }
        changed = true
        return {
          ...node,
          data: {
            ...node.data,
            inputCount,
            inputSourceName,
            inputItems,
            inputPreviewIndex: Math.min(currentData.inputPreviewIndex ?? 0, Math.max(inputCount - 1, 0)),
            inputArrayMode,
            inputArrayFields,
          },
        }
      })
      return changed ? next : current
    })
  }, [getArrayItems, setNodes])

  const buildArrayData = useCallback(
    (nodeId: string, data?: Partial<ArrayNodeData>): ArrayNodeData => ({
      name: data?.name ?? '数组节点',
      itemsText: data?.itemsText ?? '',
      arrayMode: data?.arrayMode ?? 'text',
      tableColumns: data?.tableColumns ?? ['prompt'],
      tableRows: data?.tableRows ?? [],
      onChangeItems: (itemsText: string) => updateArrayNode(nodeId, { itemsText }),
      onChangeArrayMode: (mode: ArrayMode) => updateArrayNode(nodeId, { arrayMode: mode }),
      onChangeTableColumns: (columns: string[]) => updateArrayNode(nodeId, { tableColumns: columns }),
      onChangeTableRows: (rows: Record<string, string>[]) => updateArrayNode(nodeId, { tableRows: rows }),
    }),
    [updateArrayNode]
  )

  const buildLoopData = useCallback(
    (loopId: string, data?: Partial<LoopNodeData>): LoopNodeData => ({
      name: data?.name ?? '循环节点',
      prompts: data?.prompts ?? '',
      inputCount: data?.inputCount,
      inputSourceName: data?.inputSourceName,
      inputItems: data?.inputItems,
      inputPreviewIndex: data?.inputPreviewIndex,
      inputArrayMode: data?.inputArrayMode,
      inputArrayFields: data?.inputArrayFields,
      childWorkflowId: data?.childWorkflowId,
      childWorkflowName: data?.childWorkflowName,
      childWorkflowParamCount: data?.childWorkflowParamCount,
      childWorkflowBackendId: data?.childWorkflowBackendId,
      childWorkflowOutputType: data?.childWorkflowOutputType,
      childWorkflowParams: data?.childWorkflowParams,
      childWorkflowValues: data?.childWorkflowValues,
      loopParamKey: data?.loopParamKey,
      loopParamOptions: data?.loopParamOptions,
      paramMappings: data?.paramMappings,
      running: data?.running ?? false,
      progress: data?.progress,
      stage: data?.stage,
      onChangePrompts: (prompts: string) => updateLoopNode(loopId, { prompts }),
      onChangeLoopParam: (key: string) => {
        updateLoopNode(loopId, { loopParamKey: key })
      },
      onChangeParamMapping: (paramKey: string, mapping: ParamMapping) => {
        const node = nodesRef.current.find((n) => n.id === loopId)
        const currentMappings = (node?.data as LoopNodeData | undefined)?.paramMappings ?? {}
        updateLoopNode(loopId, { paramMappings: { ...currentMappings, [paramKey]: mapping } })
      },
      onChangeInputPreviewIndex: (index: number) => updateLoopNode(loopId, { inputPreviewIndex: index }),
      onRun: () => void handleRunLoopRef.current?.(loopId),
    }),
    [updateLoopNode, handleAssetEdit]
  )

  const buildMultiImageOutputData = useCallback(
    (nodeId: string, data?: Partial<MultiImageOutputNodeData>): MultiImageOutputNodeData => ({
      name: data?.name ?? '多图输出',
      urls: data?.urls ?? [],
      displayMode: data?.displayMode ?? 'multi',
      onToggleMode: () => {
        const node = nodesRef.current.find((n) => n.id === nodeId)
        const current = (node?.data as MultiImageOutputNodeData | undefined)?.displayMode ?? 'multi'
        updateMultiImageOutputNode(nodeId, { displayMode: current === 'multi' ? 'single' : 'multi' })
      },
      onPreview: (url) => {
        const node = nodesRef.current.find((n) => n.id === nodeId)
        const urls = (node?.data as MultiImageOutputNodeData | undefined)?.urls ?? []
        const idx = urls.indexOf(url)
        setPreviewUrls(urls)
        setPreviewIndex(idx >= 0 ? idx : 0)
      },
      onEditImage: (url) => handleAssetEdit(nodeId, url),
    }),
    [handleAssetEdit, updateMultiImageOutputNode]
  )

  const buildVideoOutputData = useCallback(
    (_nodeId: string, data?: Partial<VideoOutputNodeData>): VideoOutputNodeData => ({
      name: data?.name ?? '视频输出',
      urls: data?.urls ?? [],
      onPreview: (url) => { setPreviewUrls([url]); setPreviewIndex(0) },
    }),
    []
  )

  const buildPromptBatchData = useCallback(
    (batchId: string, data?: Partial<PromptBatchNodeData>): PromptBatchNodeData => ({
      name: data?.name ?? '多提示词输出',
      prompts: data?.prompts ?? '',
      urls: data?.urls ?? [],
      displayMode: data?.displayMode ?? 'multi',
      running: false,
      progress: null,
      stage: '',
      onChangePrompts: (prompts) => updatePromptBatchNode(batchId, { prompts }),
      onRun: () => void handleRunPromptBatchRef.current?.(batchId),
      onToggleMode: () => {
        const node = nodesRef.current.find((n) => n.id === batchId)
        const current = (node?.data as PromptBatchNodeData | undefined)?.displayMode ?? 'multi'
        updatePromptBatchNode(batchId, { displayMode: current === 'multi' ? 'single' : 'multi' })
      },
      onPreview: (url) => { setPreviewUrls([url]); setPreviewIndex(0) },
    }),
    [updatePromptBatchNode]
  )

  const buildAssetData = useCallback(
    (
      assetId: string,
      name: string,
      urls: string[],
      displayMode: 'single' | 'multi',
      extra?: {
        elapsedMs?: number
        prompt?: string
        aspectRatio?: string
        params?: AssetParamItem[]
        locked?: boolean
        editVersions?: unknown[]
        baselineUrls?: string[]
        activeVersionId?: string
        imageEditStates?: Record<string, unknown>
        /** 媒体类型（image/video/audio），由 outputSlot 携带；未指定时 AssetNode 自动按 URL 后缀判断 */
        mediaKind?: 'image' | 'video' | 'audio'
        /** 关联的 outputSlot key（=ComfyUI 节点 id），供 handleRun 精确匹配下游节点 */
        slotKey?: string
      }
    ): AssetNodeData => ({
      name,
      urls,
      displayMode,
      locked: extra?.locked ?? false,
      mediaKind: extra?.mediaKind,
      slotKey: extra?.slotKey,
      elapsedMs: extra?.elapsedMs,
      prompt: extra?.prompt,
      aspectRatio: extra?.aspectRatio,
      params: extra?.params,
      editVersions: extra?.editVersions,
      baselineUrls: extra?.baselineUrls,
      activeVersionId: extra?.activeVersionId,
      imageEditStates: extra?.imageEditStates,
      onRename: (newName) => handleAssetRename(assetId, newName),
      onToggleMode: () => handleAssetToggleMode(assetId),
      onToggleLock: () => handleAssetToggleLock(assetId),
      onPreview: (url) => { setPreviewUrls([url]); setPreviewIndex(0) },
      onEditImage: (url) => handleAssetEdit(assetId, url),
      onDelete: () => void handleDeleteAssetNode(assetId),
    }),
    [handleAssetRename, handleAssetToggleMode, handleAssetToggleLock, handleAssetEdit, handleDeleteAssetNode]
  )

  const addArrayNode = useCallback(
    (position: { x: number; y: number }) => {
      const arrayId = nextId('array')
      setNodes((nds) => [
        ...nds,
        {
          id: arrayId,
          type: 'arrayNode',
          position,
          data: buildArrayData(arrayId),
        },
      ])
      setSelectedNodeId(arrayId)
      return arrayId
    },
    [buildArrayData, nextId, setNodes]
  )

  const addLoopNode = useCallback(
    (position: { x: number; y: number }) => {
      const loopId = nextId('loop')
      setNodes((nds) => [
        ...nds,
        {
          id: loopId,
          type: 'loopNode',
          position,
          width: 340,
          height: 360,
          data: buildLoopData(loopId),
        },
      ])
      setSelectedNodeId(loopId)
      return loopId
    },
    [buildLoopData, nextId, setNodes]
  )

  const addMultiImageOutputNode = useCallback(
    (position: { x: number; y: number }) => {
      const outputId = nextId('multi-output')
      setNodes((nds) => [
        ...nds,
        {
          id: outputId,
          type: 'multiImageOutputNode',
          position,
          data: buildMultiImageOutputData(outputId),
        },
      ])
      setSelectedNodeId(outputId)
      return outputId
    },
    [buildMultiImageOutputData, nextId, setNodes]
  )

  const addVideoOutputNode = useCallback(
    (position: { x: number; y: number }) => {
      const outputId = nextId('video-output')
      setNodes((nds) => [
        ...nds,
        {
          id: outputId,
          type: 'videoOutputNode',
          position,
          data: buildVideoOutputData(outputId),
        },
      ])
      setSelectedNodeId(outputId)
      return outputId
    },
    [buildVideoOutputData, nextId, setNodes]
  )

  const addPromptBatchNode = useCallback(
    (position: { x: number; y: number }) => {
      const batchId = nextId('batch')
      setNodes((nds) => [
        ...nds,
        {
          id: batchId,
          type: 'promptBatchNode',
          position,
          data: buildPromptBatchData(batchId),
        },
      ])
      setSelectedNodeId(batchId)
      return batchId
    },
    [buildPromptBatchData, nextId, setNodes]
  )

  const addAssetNode = useCallback(
    (position: { x: number; y: number }) => {
      const assetId = nextId('asset')
      assetNameCounter.current += 1
      const name = `image_output_${assetNameCounter.current}`
      setNodes((nds) => [
        ...nds,
        {
          id: assetId,
          type: 'assetNode',
          position,
          data: buildAssetData(assetId, name, [], 'single'),
        },
      ])
      setSelectedNodeId(assetId)
      return assetId
    },
    [buildAssetData, nextId, setNodes]
  )

  /**
   * 导入外部图片文件到画布：
   * - 每张图对应一个 assetNode（依次错开 40px 排列，避免完全重叠）
   * - 文件通过 comfyuiApi.uploadImage(file, undefined, projectId) 落到 <workspace>/canvas/<projectId>/
   * - 上传前先用本地 blob URL 建占位节点，成功后替换成后端返回的 URL；失败则删除对应节点
   * - 触发点：Ctrl+V 粘贴 或 从系统资源管理器/浏览器 拖拽文件到画布
   */
  const handleImportFiles = useCallback(
    async (files: File[], basePosition: { x: number; y: number }) => {
      const imageFiles = files.filter((f) => f.type.startsWith('image/'))
      if (imageFiles.length === 0) return
      const pid = currentProjectIdRef.current
      if (!pid) {
        toast.error('请先创建或打开一个画布再导入图片', { duration: 8000 })
        return
      }

      const tId = toast.loading(
        imageFiles.length === 1
          ? '正在导入 1 张图片…'
          : `正在导入 ${imageFiles.length} 张图片…`
      )

      // 先在纯逻辑区计算好每张图的占位数据（id + blob URL + 位置），
      // 避免把副作用放进 setNodes updater（React.StrictMode 下 updater 会被调用两次）。
      const created = imageFiles.map((file, i) => {
        const assetId = nextId('asset')
        assetNameCounter.current += 1
        const name = `image_output_${assetNameCounter.current}`
        const blobUrl = URL.createObjectURL(file)
        return {
          id: assetId,
          blobUrl,
          file,
          name,
          position: {
            x: basePosition.x + i * 40,
            y: basePosition.y + i * 40,
          },
        }
      })
      console.log('[comfyui] 计划创建 %d 个节点:', created.length, created.map((c) => c.id))

      // 一次性把所有占位节点塞进画布
      setNodes((nds) => {
        const additions: Node[] = created.map((c) => ({
          id: c.id,
          type: 'assetNode',
          position: c.position,
          data: buildAssetData(c.id, c.name, [c.blobUrl], 'single'),
        }))
        return [...nds, ...additions]
      })

      let successCount = 0
      let failCount = 0
      // 顺序上传，避免同时打爆后端；同时保证节点顺序
      for (const item of created) {
        try {
          const r = await comfyuiApi.uploadImage(item.file, undefined, pid)
          const url = r.url ?? comfyuiApi.inputFileUrl(r.name, r.type, r.subfolder)
          console.log('[comfyui] 上传成功 nodeId=%s, url=%s, backend返回=', item.id, url, r)
          setNodes((nds) => {
            const next = nds.map((n) => {
              if (n.id !== item.id) return n
              const oldData = n.data as AssetNodeData
              return {
                ...n,
                data: {
                  ...oldData,
                  urls: [url],
                  baselineUrls: [url],
                } as AssetNodeData,
              }
            })
            const found = next.find((n) => n.id === item.id)
            console.log('[comfyui] setNodes 完成，节点 data.urls =', (found?.data as AssetNodeData | undefined)?.urls)
            return next
          })
          // 延迟释放 blob URL：等待 React 提交并让 <img> 完成加载新 URL 再释放
          // 立即 revoke 会导致旧 DOM 中的 blob src 瞬间 404（React 尚未替换 <img src>）
          const oldBlob = item.blobUrl
          setTimeout(() => URL.revokeObjectURL(oldBlob), 30000)
          successCount++
        } catch (err) {
          console.error('[comfyui] 导入图片失败:', item.file.name, err)
          // 失败：移除对应节点，释放 blob
          setNodes((nds) => nds.filter((n) => n.id !== item.id))
          URL.revokeObjectURL(item.blobUrl)
          failCount++
        }
      }

      toast.dismiss(tId)
      if (failCount === 0) {
        toast.success(`已导入 ${successCount} 张图片到画布`)
      } else if (successCount === 0) {
        toast.error(`${failCount} 张图片导入失败`, { duration: 10000 })
      } else {
        toast.warning(
          `${successCount} 张图片已导入，${failCount} 张失败`,
          { duration: 10000 }
        )
      }
    },
    [buildAssetData, nextId, setNodes]
  )

  // 把最新的 handleImportFiles / screenToFlowPosition 同步给 paste 事件监听
  useEffect(() => {
    handleImportFilesRef.current = handleImportFiles
    screenToFlowPositionRef.current = screenToFlowPosition
  }, [handleImportFiles, screenToFlowPosition])

  const runWorkflowOnce = useCallback(
    async (
      wfNodeId: string,
      values: Record<string, unknown>,
      onProgress?: (percent: number, stage: string) => void
    ): Promise<{ urls: string[]; urlsBySlot: Record<string, string[]> }> => {
      const backendId = backendIdRef.current[wfNodeId] ?? wfNodeId
      Object.keys(values)
        .filter((k) => k.startsWith('__seedMode__.'))
        .forEach((modeKey) => {
          if (values[modeKey] === 'randomize') {
            const seedNodeId = modeKey.replace('__seedMode__.', '')
            values[`${seedNodeId}.seed`] = randomSeed()
          }
        })
      const outputType = nodesRef.current.find((n) => n.id === wfNodeId)?.data?.outputType
      const outputLabel = outputType === 'video' ? '视频生成中' : outputType === 'audio' ? '音频生成中' : '图片生成中'
      const taskId = await comfyuiApi.submit(backendId, values, currentProjectIdRef.current ?? undefined)
      for (;;) {
        await new Promise((r) => setTimeout(r, 800))
        const p = await comfyuiApi.progress(taskId)
        if (p.status === 'running') {
          onProgress?.(p.percent, p.max > 0 ? outputLabel : '加载模型中')
        } else if (p.status === 'done') {
          return { urls: p.urls ?? [], urlsBySlot: p.urlsBySlot ?? {} }
        } else {
          throw new Error(p.message || '生成失败')
        }
      }
    },
    []
  )

  const handleRun = useCallback(
    async (nodeId: string) => {
      setNodeRunning(nodeId, true, 0, '排队中')
      try {
        const values = { ...(valuesRef.current[nodeId] ?? {}) }
        Object.keys(values)
          .filter((k) => k.startsWith('__seedMode__.'))
          .forEach((modeKey) => {
            if (values[modeKey] === 'randomize') {
              const seedNodeId = modeKey.replace('__seedMode__.', '')
              const newSeed = randomSeed()
              values[`${seedNodeId}.seed`] = newSeed
              handleChangeValue(nodeId, `${seedNodeId}.seed`, newSeed)
            }
          })

        const startTime = Date.now()
        const runResult = await runWorkflowOnce(nodeId, values, (percent, stage) => {
          setNodeRunning(nodeId, true, percent, stage)
        })
        const elapsedMs = Date.now() - startTime
        const { urls, urlsBySlot } = runResult

        const wfNodeId = nodeId
        const currentNodes = nodesRef.current
        const wfNode = currentNodes.find((n) => n.id === wfNodeId)
        const baseX = (wfNode?.position.x ?? 0) + 360
        const baseY = wfNode?.position.y ?? 0

        // ---- 元数据快照（每个 slot 都会写入） ----
        const wfParams = (wfNode?.data as WorkflowNodeData | undefined)?.params ?? []
        const positiveParam = wfParams.find(
          (p) =>
            p.type === 'string' &&
            (p.nodeType === 'CLIPTextEncode' || p.nodeType === 'PrimitiveStringMultiline') &&
            !/负面|negative/i.test(p.title) &&
            !/负面|negative/i.test(p.label)
        )
        const widthParam = wfParams.find((p) => p.paramName === 'width')
        const heightParam = wfParams.find((p) => p.paramName === 'height')
        const promptText = positiveParam
          ? String(values[`${positiveParam.nodeId}.${positiveParam.paramName}`] ?? positiveParam.value ?? '')
          : ''
        const w = widthParam ? Number(values[`${widthParam.nodeId}.width`] ?? widthParam.value) : undefined
        const h = heightParam ? Number(values[`${heightParam.nodeId}.height`] ?? heightParam.value) : undefined
        const aspectRatio = formatAspectRatio(w, h)
        const paramSnapshot: AssetParamItem[] = wfParams
          .filter(
            (p) =>
              !(p.type === 'string' && (p.nodeType === 'CLIPTextEncode' || p.nodeType === 'PrimitiveStringMultiline'))
          )
          .map((p) => {
            const v = values[`${p.nodeId}.${p.paramName}`] ?? p.value
            return { label: paramLabel(p), value: String(v ?? '') }
          })

        // ---- 拿到当前工作流的 outputSlots 定义 ----
        // 优先用节点上带的（拖入时透传），退回工作流列表里查
        const wfData = wfNode?.data as WorkflowNodeData | undefined
        const backendId = wfData?.backendId
        const rawWorkflow = backendId
          ? importedWorkflowsRef.current.find((w) => w.id === backendId)
          : undefined
        const outputSlots: OutputSlot[] = (() => {
          const raw = rawWorkflow?.outputSlots
          if (Array.isArray(raw)) return raw
          if (typeof raw === 'string' && raw) {
            try { return JSON.parse(raw) as OutputSlot[] } catch { /* ignore */ }
          }
          return []
        })()

        // ---- 决策要给哪些 slot 分派 ----
        // 情况 A：后端返回了 urlsBySlot 且不为空 → 按 slot 精确分派（多输出场景）
        // 情况 B：后端没有 slot 信息（老工作流）→ 用单一 fallback slot（key='main'），根据 URL 后缀猜类型
        const slotAssignments: Array<{ slot: OutputSlot; slotUrls: string[] }> = []
        const bySlotEntries = Object.entries(urlsBySlot).filter(([, v]) => v.length > 0)
        if (bySlotEntries.length > 0) {
          for (const [slotKey, slotUrls] of bySlotEntries) {
            const declared = outputSlots.find((s) => s.key === slotKey)
            const inferredKind: 'image' | 'video' | 'audio' = slotUrls.some(isVideoUrl) ? 'video' : 'image'
            const slot: OutputSlot = declared ?? {
              key: slotKey,
              label: inferredKind === 'video' ? '视频输出' : '图片输出',
              mediaKind: inferredKind,
              comfyNodeId: slotKey,
            }
            slotAssignments.push({ slot, slotUrls })
          }
        } else if (urls.length > 0) {
          // 老工作流兜底：单 slot
          const inferredKind: 'image' | 'video' | 'audio' = urls.some(isVideoUrl) ? 'video' : 'image'
          slotAssignments.push({
            slot: {
              key: 'main',
              label: inferredKind === 'video' ? '视频输出' : '图片输出',
              mediaKind: inferredKind,
              comfyNodeId: 'main',
            },
            slotUrls: urls,
          })
        }

        // ---- 统一 helper：把一个 slot 的输出应用到画布 ----
        // 语义：
        // 1. 先找已连接到该工作流的、slotKey 匹配的 assetNode（精确匹配）
        // 2. 找不到再找已连接的、slotKey 未设置的 assetNode（老兼容匹配）
        // 3. 都找不到 → 使用 preferredId（asset-<wfId>-<slotKey>）复用/新建
        // 4. 若目标节点 locked → 新建下一个节点，位置错开
        // 5. 否则覆盖 urls（含视频，多次运行不再累加）
        const appliedNodeIds: string[] = []
        const pendingNodes: Node[] = []
        const pendingEdgeAdd: Edge[] = []
        const pendingEdgeRemoveIds: string[] = []
        for (let i = 0; i < slotAssignments.length; i++) {
          const { slot, slotUrls } = slotAssignments[i]
          const isMulti = slotUrls.length > 1

          // 匹配已连接节点
          const connectedAssetEdges = edgesRef.current.filter((e) => {
            if (e.source !== wfNodeId) return false
            const target = currentNodes.find((n) => n.id === e.target)
            return target?.type === 'assetNode'
          })
          let target = connectedAssetEdges
            .map((e) => currentNodes.find((n) => n.id === e.target))
            .find((n) => (n?.data as AssetNodeData | undefined)?.slotKey === slot.key)
          // 老兼容：单 slot 场景，未设置 slotKey 的 assetNode 也当匹配
          if (!target && slotAssignments.length === 1) {
            target = connectedAssetEdges
              .map((e) => currentNodes.find((n) => n.id === e.target))
              .find((n) => !(n?.data as AssetNodeData | undefined)?.slotKey)
          }
          const targetData = target?.data as AssetNodeData | undefined

          // 决定最终目标 id：锁定则新建，否则复用/生成默认
          const useNew = !!targetData?.locked
          const defaultId = `asset-${wfNodeId}-${slot.key}`
          const finalTargetId = useNew ? nextId('asset') : target?.id ?? defaultId

          // 位置计算
          const finalPosition = (() => {
            if (target && !useNew) return target.position
            // 新建或首次创建：多 slot 按纵向排列，锁定新建则再往下推 320
            const stackY = baseY + i * 320
            if (useNew) {
              const siblings = currentNodes.filter(
                (n) =>
                  n.type === 'assetNode' &&
                  edgesRef.current.some((e) => e.source === wfNodeId && e.target === n.id) &&
                  (n.data as AssetNodeData | undefined)?.slotKey === slot.key
              )
              const maxY = siblings.length > 0 ? Math.max(...siblings.map((s) => s.position.y)) : stackY - 320
              return { x: baseX, y: maxY + 320 }
            }
            return { x: baseX, y: stackY }
          })()

          const oldName = targetData?.name
          const defaultName = slot.label + (slotAssignments.length > 1 ? '' : '')
          const assetName =
            useNew
              ? `${slot.label}_${(assetNameCounter.current += 1)}`
              : oldName ?? (() => {
                  assetNameCounter.current += 1
                  return `${defaultName}_${assetNameCounter.current}`
                })()

          const assetNode: Node = {
            id: finalTargetId,
            type: 'assetNode',
            position: finalPosition,
            data: buildAssetData(finalTargetId, assetName, slotUrls, isMulti ? 'multi' : 'single', {
              elapsedMs,
              prompt: promptText,
              aspectRatio,
              params: paramSnapshot,
              locked: useNew ? false : targetData?.locked ?? false,
              mediaKind: slot.mediaKind,
              slotKey: slot.key,
            }),
          }
          pendingNodes.push(assetNode)
          const edgeId = `e-${wfNodeId}-${finalTargetId}`
          pendingEdgeRemoveIds.push(edgeId)
          // 单 slot 时 WorkflowNode 的 Handle 没有 id，不能设置 sourceHandle，否则 React Flow 找不到 handle 导致边不渲染
          const isSingleSlot = slotAssignments.length <= 1
          const newEdge: Edge = {
            id: edgeId,
            source: wfNodeId,
            target: finalTargetId,
            animated: true,
            style: { stroke: '#171717', strokeWidth: 2 },
          }
          if (!isSingleSlot) {
            newEdge.sourceHandle = slot.key
          }
          pendingEdgeAdd.push(newEdge)
          appliedNodeIds.push(finalTargetId)
        }

        // ---- 一次性提交所有节点和边的更新，避免分开 setState 导致边不显示 ----
        if (pendingNodes.length > 0) {
          const nodeIdsToAdd = new Set(pendingNodes.map((n) => n.id))
          setNodes((nds) => {
            const without = nds.filter((n) => !nodeIdsToAdd.has(n.id))
            return [...without, ...pendingNodes]
          })
        }
        if (pendingEdgeAdd.length > 0) {
          const removeSet = new Set(pendingEdgeRemoveIds)
          setEdges((eds) => {
            const filtered = eds.filter((e) => !removeSet.has(e.id))
            return [...filtered, ...pendingEdgeAdd]
          })
        }

        // ---- 汇总 toast ----
        if (slotAssignments.length === 0) {
          toast.warning('工作流已执行完成，但未产出任何文件')
        } else if (slotAssignments.length === 1) {
          const kind = slotAssignments[0].slot.mediaKind
          const label = kind === 'video' ? '视频' : kind === 'audio' ? '音频' : '图片'
          toast.success(`${label}生成成功，共 ${slotAssignments[0].slotUrls.length} 个`)
        } else {
          toast.success(
            `已生成 ${slotAssignments.length} 组输出：` +
              slotAssignments.map((a) => `${a.slot.label}×${a.slotUrls.length}`).join('、')
          )
        }
      } catch (e) {
        toast.error(`生成失败：${e instanceof Error ? e.message : '未知错误'}`)
      } finally {
        setNodeRunning(nodeId, false)
      }
    },
    [setEdges, setNodes, setNodeRunning, handleChangeValue, buildAssetData, buildVideoOutputData, nextId, runWorkflowOnce]
  )

  const handleRunLoop = useCallback(
    async (loopId: string) => {
      const loopNode = nodesRef.current.find((n) => n.id === loopId)
      const loopData = loopNode?.data as LoopNodeData | undefined
      const inputEdge = edgesRef.current.find((e) => e.target === loopId && nodesRef.current.find((n) => n.id === e.source)?.type === 'arrayNode')
      const inputNode = inputEdge ? nodesRef.current.find((n) => n.id === inputEdge.source) : undefined
      const inputData = inputNode?.data as ArrayNodeData | undefined

      // Build items based on array mode
      const arrayMode = inputData?.arrayMode ?? 'text'
      let items: Array<Record<string, string>> = []
      if (arrayMode === 'text') {
        const textItems = inputData ? getArrayItems(inputData.itemsText) : []
        items = textItems.map((text) => ({ item: text }))
      } else {
        items = (inputData?.tableRows ?? []).map((row) => ({ ...row }))
      }

      if (!loopNode || items.length === 0) {
        toast.error('请先连接有内容的数组节点')
        return
      }
      if (!loopData?.childWorkflowBackendId || !loopData.childWorkflowParams) {
        toast.error('请先把工作流拖到循环节点内部')
        return
      }

      const wfData = {
        backendId: loopData.childWorkflowBackendId,
        name: loopData.childWorkflowName ?? '内部工作流',
        params: loopData.childWorkflowParams as ComfyParam[],
        values: loopData.childWorkflowValues ?? {},
      }

      const outputEdge = edgesRef.current.find((e) => e.source === loopId)
      const outputNode = outputEdge
        ? nodesRef.current.find(
            (n) =>
              n.id === outputEdge.target &&
              // multiImageOutputNode 保留（多图批量场景），videoOutputNode 已被合并到 assetNode
              (n.type === 'multiImageOutputNode' || n.type === 'assetNode')
          )
        : undefined
      if (!outputNode) {
        toast.error('请把循环节点连接到多图输出节点或图片输出节点')
        return
      }

      // Build paramMappings with defaults
      const paramMappings = loopData.paramMappings ?? {}
      const loopParamOptions = loopData.loopParamOptions ?? []
      const effectiveMappings: Record<string, ParamMapping> = {}
      for (const opt of loopParamOptions) {
        if (paramMappings[opt.key]) {
          effectiveMappings[opt.key] = paramMappings[opt.key]
        } else if (opt.key === loopData.loopParamKey) {
          effectiveMappings[opt.key] = { mode: 'array', arrayField: arrayMode === 'table' ? (loopData.inputArrayFields?.[0] ?? '') : 'item' }
        } else {
          effectiveMappings[opt.key] = { mode: 'fixed' }
        }
      }

      // Random seed helper
      const randomSeed = () => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)

      updateLoopNode(loopId, { running: true, progress: 0, stage: '排队中' })
      if (outputNode.type === 'multiImageOutputNode') {
        updateMultiImageOutputNode(outputNode.id, { urls: [], displayMode: 'multi' })
      } else {
        // 循环开始前清空 assetNode，避免残留旧结果
        setNodes((nds) =>
          nds.map((n) =>
            n.id === outputNode.id
              ? { ...n, data: { ...(n.data as AssetNodeData), urls: [] } }
              : n
          )
        )
      }
      try {
        const allUrls: string[] = []
        for (let i = 0; i < items.length; i += 1) {
          const values = { ...(wfData.values ?? {}) }
          // Apply paramMappings
          for (const [paramKey, mapping] of Object.entries(effectiveMappings)) {
            if (mapping.mode === 'array') {
              const field = mapping.arrayField ?? 'item'
              values[paramKey] = items[i][field] ?? ''
            } else if (mapping.mode === 'random') {
              values[paramKey] = randomSeed()
            } else {
              // fixed: use fixedValue if set, otherwise keep default from workflow values
              if (mapping.fixedValue !== undefined && mapping.fixedValue !== '') {
                values[paramKey] = mapping.fixedValue
              }
            }
          }
          const runResult = await runWorkflowOnce(wfData.backendId, values, (percent, stage) => {
            const base = (i / items.length) * 100
            const part = Math.max(0, Math.min(100, percent || 0)) / items.length
            updateLoopNode(loopId, {
              running: true,
              progress: Math.round(base + part),
              stage: `${stage} ${i + 1}/${items.length}`,
            })
          })
          const urls = runResult.urls
          allUrls.push(...urls)
          if (outputNode.type === 'multiImageOutputNode') {
            updateMultiImageOutputNode(outputNode.id, { urls: [...allUrls], displayMode: 'multi' })
          } else {
            // assetNode（可能承载视频，也可能承载图片）：累加 urls，displayMode 保持 multi
            setNodes((nds) =>
              nds.map((n) =>
                n.id === outputNode.id
                  ? {
                      ...n,
                      data: {
                        ...(n.data as AssetNodeData),
                        urls: [...allUrls],
                        displayMode: 'multi' as const,
                      },
                    }
                  : n
              )
            )
          }
          updateLoopNode(loopId, {
            running: true,
            progress: Math.round(((i + 1) / items.length) * 100),
            stage: `已完成 ${i + 1}/${items.length}`,
          })
        }
        updateLoopNode(loopId, { running: false, progress: null, stage: '' })
        if (outputNode.type === 'multiImageOutputNode') {
          updateMultiImageOutputNode(outputNode.id, { urls: allUrls, displayMode: 'multi' })
        } else {
          setNodes((nds) =>
            nds.map((n) =>
              n.id === outputNode.id
                ? {
                    ...n,
                    data: {
                      ...(n.data as AssetNodeData),
                      urls: allUrls,
                      displayMode: 'multi' as const,
                    },
                  }
                : n
            )
          )
        }
        toast.success(`循环完成，共输出 ${allUrls.length} 个文件`)
      } catch (e) {
        updateLoopNode(loopId, { running: false, progress: null, stage: '' })
        toast.error(`循环执行失败：${e instanceof Error ? e.message : '未知错误'}`)
      }
    },
    [getArrayItems, runWorkflowOnce, updateLoopNode, updateMultiImageOutputNode, buildVideoOutputData, setNodes]
  )

  useEffect(() => {
    handleRunLoopRef.current = handleRunLoop
  }, [handleRunLoop])

  const addWorkflowNode = useCallback(
    async (wf: ComfyWorkflow, position?: { x: number; y: number }, loopId?: string) => {
      try {
        const params = parseParams(wf.paramSchema)
        let values: Record<string, unknown> = {}
        try {
          values = wf.paramValues ? JSON.parse(wf.paramValues) : {}
        } catch {
          values = {}
        }
        params.forEach((p) => {
          const key = `${p.nodeId}.${p.paramName}`
          if (values[key] === undefined) values[key] = p.value
        })
        const nodeId = nextId('wf')
        if (loopId) {
          updateLoopNode(loopId, {
            childWorkflowId: nodeId,
            childWorkflowName: formatWorkflowName(wf.name),
            childWorkflowParamCount: params.length,
            childWorkflowBackendId: wf.id,
            childWorkflowOutputType: wf.outputType,
            childWorkflowParams: params,
            childWorkflowValues: { ...values },
            loopParamOptions: buildLoopParamOptions(params),
            loopParamKey: getDefaultLoopParamKey(params),
          })
          toast.success(`已把「${formatWorkflowName(wf.name)}」放入循环节点`)
          setSelectedNodeId(loopId)
          return
        }
        valuesRef.current[nodeId] = { ...values }
        backendIdRef.current[nodeId] = wf.id
        setNodes((nds) => {
          const offset = nds.length * 40
          const data: WorkflowNodeData = {
            nodeId,
            backendId: wf.id,
            name: formatWorkflowName(wf.name),
            outputType: wf.outputType,
            outputSlots: (() => {
              const raw = wf.outputSlots
              if (Array.isArray(raw)) return raw
              if (typeof raw === 'string' && raw) {
                try { return JSON.parse(raw) as OutputSlot[] } catch { return undefined }
              }
              return undefined
            })(),
            params,
            values: { ...values },
            running: false,
            onChangeValue: (key, value) => handleChangeValue(nodeId, key, value),
            onRun: handleRun,
          }
          const newNode: Node = {
            id: nodeId,
            type: 'workflowNode',
            position: position ?? { x: 80 + offset, y: 80 + offset },
            data,
          }
          return [...nds, newNode]
        })
        setSelectedNodeId(nodeId)
      } catch (e) {
        toast.error(`添加失败：${e instanceof Error ? e.message : '未知错误'}`)
      }
    },
    [handleChangeValue, handleRun, setNodes, nextId, updateLoopNode, buildLoopParamOptions, getDefaultLoopParamKey]
  )

  const handleRunPromptBatch = useCallback(
    async (batchId: string) => {
      const batchNode = nodesRef.current.find((n) => n.id === batchId)
      const batchData = batchNode?.data as PromptBatchNodeData | undefined
      const prompts = (batchData?.prompts ?? '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)

      if (!batchNode || prompts.length === 0) {
        toast.error('请先在多提示词输出节点中填写提示词')
        return
      }

      const sourceEdge = edgesRef.current.find((e) => e.target === batchId)
      const workflowNodes = nodesRef.current.filter((n) => n.type === 'workflowNode')
      const connectedNode = sourceEdge ? workflowNodes.find((n) => n.id === sourceEdge.source) : undefined
      const zImageNode = workflowNodes.find((n) => {
        const d = n.data as WorkflowNodeData
        return /z[-_\s]*image|文生图/i.test(d.name) && d.outputType === 'image'
      })
      const wfNode = connectedNode ?? zImageNode ?? (workflowNodes.length === 1 ? workflowNodes[0] : undefined)
      const wfData = wfNode?.data as WorkflowNodeData | undefined
      if (!wfNode || !wfData) {
        toast.error('请先在画布中添加 Z-image 文生图节点')
        return
      }
      if (!connectedNode && workflowNodes.length > 1 && !zImageNode) {
        toast.error('画布中有多个文生图节点，请保留一个 Z-image 文生图节点或用连线指定目标')
        return
      }

      const positiveParam = findPositivePromptParam(wfData.params)
      if (!positiveParam) {
        toast.error('没有找到可临时覆盖的正向提示词参数')
        return
      }

      updatePromptBatchNode(batchId, { running: true, progress: 0, stage: '排队中', urls: [] })
      try {
        const allUrls: string[] = []
        for (let i = 0; i < prompts.length; i += 1) {
          const prompt = prompts[i]
          const values = { ...(valuesRef.current[wfNode.id] ?? {}) }
          values[`${positiveParam.nodeId}.${positiveParam.paramName}`] = prompt
          const runResult2 = await runWorkflowOnce(wfNode.id, values, (percent, stage) => {
            const base = (i / prompts.length) * 100
            const part = Math.max(0, Math.min(100, percent || 0)) / prompts.length
            updatePromptBatchNode(batchId, {
              running: true,
              progress: Math.round(base + part),
              stage: `${stage} ${i + 1}/${prompts.length}`,
            })
          })
          const urls = runResult2.urls
          allUrls.push(...urls)
          updatePromptBatchNode(batchId, {
            urls: [...allUrls],
            running: true,
            progress: Math.round(((i + 1) / prompts.length) * 100),
            stage: `已完成 ${i + 1}/${prompts.length}`,
          })
        }
        updatePromptBatchNode(batchId, { urls: allUrls, running: false, progress: null, stage: '' })
        toast.success(`批量生成完成，共 ${allUrls.length} 张`)
      } catch (e) {
        updatePromptBatchNode(batchId, { running: false, progress: null, stage: '' })
        toast.error(`批量生成失败：${e instanceof Error ? e.message : '未知错误'}`)
      }
    },
    [findPositivePromptParam, runWorkflowOnce, updatePromptBatchNode]
  )

  useEffect(() => {
    handleRunPromptBatchRef.current = handleRunPromptBatch
  }, [handleRunPromptBatch])

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  useEffect(() => {
    const signature = JSON.stringify({
      edges: edges
        .filter((edge) => {
          const source = nodes.find((node) => node.id === edge.source)
          const target = nodes.find((node) => node.id === edge.target)
          return source?.type === 'arrayNode' && target?.type === 'loopNode'
        })
        .map((edge) => `${edge.source}->${edge.target}`)
        .sort(),
      arrays: nodes
        .filter((node) => node.type === 'arrayNode')
        .map((node) => {
          const data = node.data as ArrayNodeData
          return [node.id, data.name, data.itemsText, data.arrayMode, data.tableColumns, data.tableRows]
        }),
    })
    if (lastLoopInputSignatureRef.current === signature) return
    lastLoopInputSignatureRef.current = signature
    refreshLoopInputMeta(edges)
  }, [edges, nodes, refreshLoopInputMeta])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY })

      // 1. 外部文件（系统资源管理器/浏览器）拖入 → 作为图片素材导入
      const externalFiles = Array.from(event.dataTransfer.files ?? [])
      if (externalFiles.length > 0) {
        void handleImportFiles(externalFiles, position)
        return
      }

      // 2. 顶部工具栏的节点拖拽
      const raw = event.dataTransfer.getData('application/comfy-node')
      if (!raw) return
      try {
        const payload = JSON.parse(raw) as { kind: 'workflow' | 'asset' | 'array' | 'promptBatch' | 'loop' | 'multiImageOutput' | 'videoOutput'; workflow?: ComfyWorkflow }
        if (payload.kind === 'asset') {
          addAssetNode(position)
        } else if (payload.kind === 'array') {
          addArrayNode(position)
        } else if (payload.kind === 'promptBatch') {
          addPromptBatchNode(position)
        } else if (payload.kind === 'loop') {
          addLoopNode(position)
        } else if (payload.kind === 'multiImageOutput') {
          addMultiImageOutputNode(position)
        } else if (payload.kind === 'videoOutput') {
          addVideoOutputNode(position)
        } else if (payload.kind === 'workflow' && payload.workflow) {
          const loop = nodesRef.current.find((n) => {
            if (n.type !== 'loopNode') return false
            const width = (n.width as number | undefined) ?? 420
            const height = (n.height as number | undefined) ?? 360
            return position.x >= n.position.x && position.x <= n.position.x + width && position.y >= n.position.y && position.y <= n.position.y + height
          })
          void addWorkflowNode(payload.workflow, position, loop?.id)
        }
      } catch {
        return
      }
    },
    [screenToFlowPosition, handleImportFiles, addAssetNode, addArrayNode, addPromptBatchNode, addLoopNode, addMultiImageOutputNode, addVideoOutputNode, addWorkflowNode]
  )

  // 分组操作
  const handleDeleteGroup = useCallback(
    (groupId: string) => {
      const groupLabel = groups.find((g) => g.id === groupId)?.label ?? '分组'
      // 移除节点的 groupId
      setNodes((nds) => {
        // 移除分组节点
        const groupNodeId = nds.find(
          (n) => n.type === 'groupNode' && (n.data as GroupNodeData).groupId === groupId
        )?.id
        return nds
          .filter((n) => n.id !== groupNodeId)
          .map((n) =>
            n.data?.groupId === groupId
              ? { ...n, data: { ...n.data, groupId: undefined } }
              : n
          )
      })
      setGroups((prev) => prev.filter((g) => g.id !== groupId))
      toast.success(`已删除分组「${groupLabel}」`)
    },
    [groups, setNodes]
  )

  const handleRenameGroup = useCallback(
    (groupId: string, label: string) => {
      setGroups((prev) =>
        prev.map((g) => (g.id === groupId ? { ...g, label } : g))
      )
      setNodes((nds) =>
        nds.map((n) => {
          if (n.type !== 'groupNode') return n
          const d = n.data as GroupNodeData
          if (d.groupId !== groupId) return n
          return { ...n, data: { ...d, label } }
        })
      )
    },
    []
  )

  const handleArrangeGroup = useCallback(
    (groupId: string) => {
      const group = groups.find((g) => g.id === groupId)
      if (!group) return
      const childNodes = nodes.filter((n) => group.childIds.includes(n.id))
      if (childNodes.length === 0) return

      // 计算子节点的边界框
      const PADDING = 40
      const GAP_X = 40
      const GAP_Y = 40
      const ITEM_W = 260
      const ITEM_H = 160
      const HEADER = 40

      // 以左上角节点为起点，重新排列
      const startX = 0
      const startY = 0

      // 先计算排列后的新位置
      const newPositions: Record<string, { x: number; y: number }> = {}
      childNodes.forEach((n, idx) => {
        const col = idx % 3
        const row = Math.floor(idx / 3)
        newPositions[n.id] = {
          x: startX + col * (ITEM_W + GAP_X),
          y: startY + row * (ITEM_H + GAP_Y),
        }
      })

      // 计算新边界
      const arrangedMinX = Math.min(...Object.values(newPositions).map((p) => p.x)) - PADDING
      const arrangedMinY = Math.min(...Object.values(newPositions).map((p) => p.y)) - PADDING - HEADER
      const arrangedMaxX = Math.max(...Object.values(newPositions).map((p) => p.x + ITEM_W)) + PADDING
      const arrangedMaxY = Math.max(...Object.values(newPositions).map((p) => p.y + ITEM_H)) + PADDING
      const newWidth = arrangedMaxX - arrangedMinX
      const newHeight = arrangedMaxY - arrangedMinY

      setNodes((nds) =>
        nds.map((n) => {
          if (n.type === 'groupNode' && (n.data as GroupNodeData).groupId === groupId) {
            // 更新分组节点本身（同时更新顶层 width/height）
            return {
              ...n,
              position: { x: arrangedMinX, y: arrangedMinY },
              width: newWidth,
              height: newHeight,
              data: { ...n.data, width: newWidth, height: newHeight },
            }
          }
          if (group.childIds.includes(n.id)) {
            const idx = group.childIds.indexOf(n.id)
            const col = idx % 3
            const row = Math.floor(idx / 3)
            return {
              ...n,
              position: {
                x: arrangedMinX + PADDING + col * (ITEM_W + GAP_X),
                y: arrangedMinY + PADDING + HEADER + row * (ITEM_H + GAP_Y),
              },
            }
          }
          return n
        })
      )
      toast.success(`已重新排列分组内节点`)
    },
    [groups, nodes, setNodes]
  )

  // 创建分组（放在所有其他分组回调之后，以便引用它们）
  const handleCreateGroup = useCallback(() => {
    if (selectedNodeIds.length < 2) {
      toast.info('请先选择至少 2 个节点')
      return
    }
    const groupId = `group-${Date.now()}`
    const groupLabel = `分组 ${groups.length + 1}`

    // 计算选中节点的边界框
    const selectedNodes = nodes.filter((n) => selectedNodeIds.includes(n.id))
    if (selectedNodes.length < 2) {
      toast.info('请先选择至少 2 个节点')
      return
    }

    // 计算边界（考虑节点尺寸）
    const PADDING = 60
    const HEADER = 40 // 标题栏高度
    const minX = Math.min(...selectedNodes.map((n) => n.position.x)) - PADDING
    const minY = Math.min(...selectedNodes.map((n) => n.position.y)) - PADDING - HEADER
    const maxX = Math.max(...selectedNodes.map((n) => n.position.x + 260)) + PADDING
    const maxY = Math.max(...selectedNodes.map((n) => n.position.y + 160)) + PADDING
    const width = maxX - minX
    const height = maxY - minY

    // 创建分组节点（React Flow 需要 width/height 作为顶层属性）
    const groupNodeId = `groupNode-${Date.now()}`
    const groupNode: Node = {
      id: groupNodeId,
      type: 'groupNode',
      position: { x: minX, y: minY },
      width,
      height,
      data: {
        label: groupLabel,
        groupId,
        childIds: [...selectedNodeIds],
        width,
        height,
        onRename: handleRenameGroup,
        onDelete: handleDeleteGroup,
        onArrange: handleArrangeGroup,
      },
      draggable: true,
      selectable: true,
    }

    const newGroup = { id: groupId, label: groupLabel, childIds: [...selectedNodeIds] }
    setGroups((prev) => [...prev, newGroup])

    // 计算排列参数
    const ITEM_W = 260 // 节点宽度
    const ITEM_H = 160  // 节点高度
    const GAP_X = 20   // 水平间距
    const GAP_Y = 20   // 垂直间距
    const COLS = 3     // 每行最多节点数

    // 计算子节点的起始位置（分组框内偏移）
    const startX = minX + 20  // 左内边距
    const startY = minY + HEADER + 20  // 标题栏下方开始

    // 更新子节点位置（在分组框内自动排列）并添加 groupId
    setNodes((nds) => {
      const updated = nds.map((n) => {
        if (!selectedNodeIds.includes(n.id)) return n
        const localIdx = selectedNodeIds.indexOf(n.id)
        const col = localIdx % COLS
        const row = Math.floor(localIdx / COLS)
        return {
          ...n,
          position: {
            x: startX + col * (ITEM_W + GAP_X),
            y: startY + row * (ITEM_H + GAP_Y),
          },
          data: { ...n.data, groupId },
        }
      })
      return [...updated, groupNode]
    })
    toast.success(`已创建分组「${groupLabel}」，包含 ${selectedNodeIds.length} 个节点`)
  }, [selectedNodeIds, groups.length, nodes, handleRenameGroup, handleDeleteGroup, handleArrangeGroup])

  const handleDuplicateNode = useCallback(
    (nodeId: string) => {
      const source = nodes.find((n) => n.id === nodeId)
      if (!source || source.type !== 'workflowNode') {
        toast.info('仅工作流节点可复制')
        return
      }
      const srcData = source.data as WorkflowNodeData
      const newNodeId = nextId('wf')
      valuesRef.current[newNodeId] = { ...(valuesRef.current[srcData.nodeId] ?? {}) }
      backendIdRef.current[newNodeId] = srcData.backendId
      const newData: WorkflowNodeData = {
        ...srcData,
        nodeId: newNodeId,
        values: { ...srcData.values },
        running: false,
        onChangeValue: (key, value) => handleChangeValue(newNodeId, key, value),
        onRun: handleRun,
      }
      setNodes((nds) => [
        ...nds,
        {
          id: newNodeId,
          type: 'workflowNode',
          position: { x: source.position.x + 40, y: source.position.y + 40 },
          data: newData,
        },
      ])
    },
    [nodes, handleChangeValue, handleRun, setNodes, nextId]
  )

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => {
        const nextEdges = addEdge({ ...connection, animated: true }, eds)
        window.setTimeout(() => refreshLoopInputMeta(nextEdges), 0)
        return nextEdges
      })
    },
    [setEdges, refreshLoopInputMeta]
  )

  const handleNodesChange = useCallback(
    (changes: NodeChange<Node>[]) => {
      setHelperLines({})

      const posChanges = changes.filter(
        (c): c is Extract<NodeChange<Node>, { type: 'position' }> =>
          c.type === 'position' && !!c.dragging && !!c.position
      )
      if (posChanges.length === 1) {
        const lines = getHelperLines(posChanges[0], nodesRef.current)
        if (lines.snapPosition.x !== undefined) posChanges[0].position!.x = lines.snapPosition.x
        if (lines.snapPosition.y !== undefined) posChanges[0].position!.y = lines.snapPosition.y
        setHelperLines({ horizontal: lines.horizontal, vertical: lines.vertical })
      }
      setNodes((nds) => applyNodeChanges(changes, nds))
    },
    [setNodes]
  )

  const onNodeClick: NodeMouseHandler = useCallback((_, node) => {
    setSelectedNodeId(node.id)
  }, [])

  // 分组拖动：记录起始位置，拖动时实时更新子节点位置
  const groupDragStartRef = useRef<{
    groupNodeId: string
    startGroupPos: { x: number; y: number }
    startChildPos: Record<string, { x: number; y: number }>
  } | null>(null)

  // 拖动分组时记录起始位置
  const onNodeDrag: OnNodeDrag<Node> = useCallback(
    (_, node) => {
      if (node.type !== 'groupNode') return
      const d = node.data as GroupNodeData
      if (!d.groupId || !d.childIds || d.childIds.length === 0) return

      if (!groupDragStartRef.current || groupDragStartRef.current.groupNodeId !== node.id) {
        const startChildPos: Record<string, { x: number; y: number }> = {}
        for (const childId of d.childIds) {
          const child = nodesRef.current.find((n) => n.id === childId)
          if (child) startChildPos[childId] = { ...child.position }
        }
        groupDragStartRef.current = {
          groupNodeId: node.id,
          startGroupPos: { ...node.position },
          startChildPos,
        }
      }
    },
    []
  )

  // 拖动结束时一次性更新子节点位置（避免拖动过程中调用 setNodes 造成无限循环）
  const onNodeDragStop: OnNodeDrag<Node> = useCallback(
    (_, node) => {
      if (node.type === 'workflowNode') {
        const loop = nodesRef.current.find((n) => {
          if (n.type !== 'loopNode') return false
          const width = (n.width as number | undefined) ?? 420
          const height = (n.height as number | undefined) ?? 360
          return node.position.x >= n.position.x && node.position.x <= n.position.x + width && node.position.y >= n.position.y && node.position.y <= n.position.y + height
        })
        if (loop) {
          const wfData = node.data as WorkflowNodeData
          updateLoopNode(loop.id, {
            childWorkflowId: node.id,
            childWorkflowName: wfData.name,
            childWorkflowParamCount: wfData.params.length,
            childWorkflowBackendId: wfData.backendId,
            childWorkflowParams: wfData.params,
            childWorkflowValues: { ...(wfData.values ?? {}) },
            loopParamOptions: buildLoopParamOptions(wfData.params),
            loopParamKey: getDefaultLoopParamKey(wfData.params),
          })
          setNodes((nds) => nds.filter((n) => n.id !== node.id))
          setSelectedNodeId(loop.id)
          toast.success(`已把「${wfData.name}」放入循环节点`)
        }
        return
      }
      if (node.type !== 'groupNode') return
      const d = node.data as GroupNodeData
      if (!d.groupId || !d.childIds || d.childIds.length === 0) return

      const start = groupDragStartRef.current
      if (!start) return

      const dx = node.position.x - start.startGroupPos.x
      const dy = node.position.y - start.startGroupPos.y
      const childIds = d.childIds

      setNodes((nds) =>
        nds.map((n) => {
          if (!childIds.includes(n.id)) return n
          const startPos = start.startChildPos[n.id]
          if (!startPos) return n
          return {
            ...n,
            position: {
              x: startPos.x + dx,
              y: startPos.y + dy,
            },
          }
        })
      )
      groupDragStartRef.current = null
    },
    [setNodes, updateLoopNode, setSelectedNodeId, buildLoopParamOptions, getDefaultLoopParamKey]
  )

  const onNodeContextMenu: NodeMouseHandler = useCallback((event, node) => {
    event.preventDefault()
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      nodeId: node.id,
      nodeType: node.type ?? '',
    })
  }, [])

  const serializeGraph = useCallback((): string => {
    const plainNodes = nodes.map((n) => {
      if (n.type === 'workflowNode') {
        const d = n.data as WorkflowNodeData
        return {
          id: n.id,
          type: n.type,
          position: n.position,
          data: {
            nodeId: d.nodeId,
            backendId: d.backendId,
            name: d.name,
            outputType: d.outputType,
            params: d.params,
            values: d.values,
          },
        }
      }
      if (n.type === 'arrayNode') {
        const d = n.data as ArrayNodeData
        return {
          id: n.id,
          type: n.type,
          position: n.position,
          data: {
            name: d.name,
            itemsText: d.itemsText,
            arrayMode: d.arrayMode,
            tableColumns: d.tableColumns,
            tableRows: d.tableRows,
          },
        }
      }
      if (n.type === 'assetNode') {
        const d = n.data as AssetNodeData
        return {
          id: n.id,
          type: n.type,
          position: n.position,
          data: {
            name: d.name,
            urls: d.urls,
            displayMode: d.displayMode,
            locked: d.locked,
            mediaKind: d.mediaKind,
            slotKey: d.slotKey,
            elapsedMs: d.elapsedMs,
            prompt: d.prompt,
            aspectRatio: d.aspectRatio,
            params: d.params,
            editVersions: d.editVersions,
            baselineUrls: d.baselineUrls,
            activeVersionId: d.activeVersionId,
            imageEditStates: d.imageEditStates,
          },
        }
      }
      if (n.type === 'promptBatchNode') {
        const d = n.data as PromptBatchNodeData
        return {
          id: n.id,
          type: n.type,
          position: n.position,
          data: {
            name: d.name,
            prompts: d.prompts,
            urls: d.urls,
            displayMode: d.displayMode,
          },
        }
      }
      if (n.type === 'loopNode') {
        const d = n.data as LoopNodeData
        return {
          id: n.id,
          type: n.type,
          position: n.position,
          width: n.width,
          height: n.height,
          data: {
            name: d.name,
            prompts: d.prompts,
            inputCount: d.inputCount,
            inputSourceName: d.inputSourceName,
            inputItems: d.inputItems,
            inputPreviewIndex: d.inputPreviewIndex,
            inputArrayMode: d.inputArrayMode,
            inputArrayFields: d.inputArrayFields,
            childWorkflowId: d.childWorkflowId,
            childWorkflowName: d.childWorkflowName,
            childWorkflowParamCount: d.childWorkflowParamCount,
            childWorkflowBackendId: d.childWorkflowBackendId,
            childWorkflowOutputType: d.childWorkflowOutputType,
            childWorkflowParams: d.childWorkflowParams,
            childWorkflowValues: d.childWorkflowValues,
            loopParamKey: d.loopParamKey,
            loopParamOptions: d.loopParamOptions,
            paramMappings: d.paramMappings,
          },
        }
      }
      if (n.type === 'multiImageOutputNode') {
        const d = n.data as MultiImageOutputNodeData
        return {
          id: n.id,
          type: n.type,
          position: n.position,
          data: {
            name: d.name,
            urls: d.urls,
            displayMode: d.displayMode,
            editVersions: d.editVersions,
            baselineUrls: d.baselineUrls,
            activeVersionId: d.activeVersionId,
            imageEditStates: d.imageEditStates,
          },
        }
      }
      if (n.type === 'videoOutputNode') {
        const d = n.data as VideoOutputNodeData
        return {
          id: n.id,
          type: n.type,
          position: n.position,
          data: {
            name: d.name,
            urls: d.urls,
          },
        }
      }
      if (n.type === 'groupNode') {
        const d = n.data as GroupNodeData
        return {
          id: n.id,
          type: n.type,
          position: n.position,
          width: n.width,
          height: n.height,
          data: {
            label: d.label,
            groupId: d.groupId,
            childIds: d.childIds,
            width: d.width,
            height: d.height,
          },
        }
      }
      return { id: n.id, type: n.type, position: n.position, data: {} }
    })
    const plainEdges = edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
    }))
    return JSON.stringify({ nodes: plainNodes, edges: plainEdges, groups })
  }, [nodes, edges])

  const rebuildGraph = useCallback(
    (graphJson: string) => {
      let parsed: { nodes?: unknown[]; edges?: unknown[]; groups?: Array<{ id: string; label: string; childIds: string[] }> } = {}
      try {
        parsed = graphJson ? JSON.parse(graphJson) : {}
      } catch {
        parsed = {}
      }
      const rawNodes = (parsed.nodes ?? []) as Array<{
        id: string
        type: string
        position: { x: number; y: number }
        data: Record<string, unknown>
      }>
      const rawGroups = parsed.groups ?? []
      valuesRef.current = {}
      backendIdRef.current = {}
      const rebuilt: Node[] = rawNodes.map((rn) => {
        if (rn.type === 'workflowNode') {
          const d = rn.data as unknown as WorkflowNodeData
          const backendId = d.backendId ?? rn.id.replace(/^wf-/, '')
          valuesRef.current[rn.id] = { ...(d.values ?? {}) }
          backendIdRef.current[rn.id] = backendId
          // 反序列化时用"当前后端工作流"的 outputSlots 覆盖（后端可能后来更新了），保证画布拿到最新的多输出定义
          const latest = importedWorkflowsRef.current.find((w) => w.id === backendId)
          const outputSlots = (() => {
            const raw = latest?.outputSlots ?? d.outputSlots
            if (Array.isArray(raw)) return raw
            if (typeof raw === 'string' && raw) {
              try { return JSON.parse(raw) as OutputSlot[] } catch { return undefined }
            }
            return undefined
          })()
          return {
            id: rn.id,
            type: 'workflowNode',
            position: rn.position,
            data: {
              ...d,
              nodeId: rn.id,
              backendId,
              outputSlots,
              running: false,
              progress: null,
              onChangeValue: (key: string, value: unknown) => handleChangeValue(rn.id, key, value),
              onRun: handleRun,
            },
          }
        }
        if (rn.type === 'arrayNode') {
          const d = rn.data as unknown as ArrayNodeData
          return {
            id: rn.id,
            type: 'arrayNode',
            position: rn.position,
            data: buildArrayData(rn.id, {
              name: d.name,
              itemsText: d.itemsText,
              arrayMode: d.arrayMode,
              tableColumns: d.tableColumns,
              tableRows: d.tableRows,
            }),
          }
        }
        if (rn.type === 'assetNode') {
          const d = rn.data as unknown as AssetNodeData
          return {
            id: rn.id,
            type: 'assetNode',
            position: rn.position,
            data: buildAssetData(rn.id, d.name, d.urls ?? [], d.displayMode ?? 'single', {
              elapsedMs: d.elapsedMs,
              prompt: d.prompt,
              aspectRatio: d.aspectRatio,
              params: d.params,
              locked: d.locked,
              mediaKind: d.mediaKind,
              slotKey: d.slotKey,
              editVersions: d.editVersions,
              baselineUrls: d.baselineUrls,
              activeVersionId: d.activeVersionId,
              imageEditStates: d.imageEditStates,
            }),
          }
        }
        if (rn.type === 'promptBatchNode') {
          const d = rn.data as unknown as PromptBatchNodeData
          return {
            id: rn.id,
            type: 'promptBatchNode',
            position: rn.position,
            data: buildPromptBatchData(rn.id, {
              name: d.name,
              prompts: d.prompts,
              urls: d.urls ?? [],
              displayMode: d.displayMode ?? 'multi',
            }),
          }
        }
        if (rn.type === 'loopNode') {
          const d = rn.data as unknown as LoopNodeData
          return {
            id: rn.id,
            type: 'loopNode',
            position: rn.position,
            width: 340,
            height: 360,
            data: buildLoopData(rn.id, {
              name: d.name,
              prompts: d.prompts,
              inputCount: d.inputCount,
              inputSourceName: d.inputSourceName,
              inputItems: d.inputItems,
              inputPreviewIndex: d.inputPreviewIndex,
              inputArrayMode: d.inputArrayMode,
              inputArrayFields: d.inputArrayFields,
              childWorkflowId: d.childWorkflowId,
              childWorkflowName: d.childWorkflowName,
              childWorkflowParamCount: d.childWorkflowParamCount,
              childWorkflowBackendId: d.childWorkflowBackendId,
              childWorkflowOutputType: d.childWorkflowOutputType,
              childWorkflowParams: d.childWorkflowParams,
              childWorkflowValues: d.childWorkflowValues,
              loopParamKey: d.loopParamKey,
              loopParamOptions: d.loopParamOptions ?? buildLoopParamOptions((d.childWorkflowParams as ComfyParam[] | undefined) ?? []),
              paramMappings: d.paramMappings,
            }),
          }
        }
        if (rn.type === 'multiImageOutputNode') {
          const d = rn.data as unknown as MultiImageOutputNodeData
          return {
            id: rn.id,
            type: 'multiImageOutputNode',
            position: rn.position,
            data: buildMultiImageOutputData(rn.id, {
              name: d.name,
              urls: d.urls ?? [],
              displayMode: d.displayMode ?? 'multi',
              editVersions: d.editVersions,
              baselineUrls: d.baselineUrls,
              activeVersionId: d.activeVersionId,
              imageEditStates: d.imageEditStates,
            }),
          }
        }
        if (rn.type === 'videoOutputNode') {
          // 无感升级：老工作流里存的 videoOutputNode 反序列化时直接转成 assetNode（mediaKind=video），
          // 保持 id 不变。这样老连线关系不会断，同时享受锁定/覆盖/新建等完整能力。
          const d = rn.data as unknown as VideoOutputNodeData
          return {
            id: rn.id,
            type: 'assetNode',
            position: rn.position,
            data: buildAssetData(
              rn.id,
              d.name || 'video_output',
              d.urls ?? [],
              'single',
              { mediaKind: 'video' }
            ),
          }
        }
        if (rn.type === 'groupNode') {
          const d = rn.data as { label: string; groupId: string; childIds: string[]; width?: number; height?: number }
          const w = d.width ?? 400
          const h = d.height ?? 300
          return {
            id: rn.id,
            type: 'groupNode',
            position: rn.position,
            width: w,
            height: h,
            data: {
              label: d.label,
              groupId: d.groupId,
              childIds: d.childIds,
              width: w,
              height: h,
              onRename: handleRenameGroup,
              onDelete: handleDeleteGroup,
              onArrange: handleArrangeGroup,
            },
            draggable: true,
            selectable: true,
          }
        }
        return { id: rn.id, type: rn.type, position: rn.position, data: {} }
      })
      const rawEdges = (parsed.edges ?? []) as Array<{ id: string; source: string; target: string }>
      const rebuiltEdges: Edge[] = rawEdges.map((re) => ({
        id: re.id,
        source: re.source,
        target: re.target,
        animated: true,
        style: { stroke: '#171717', strokeWidth: 2 },
      }))
      setNodes(rebuilt)
      setEdges(rebuiltEdges)
      setGroups(rawGroups)
      setSelectedNodeId(null)

      // 把名称计数器同步到当前最大序号，避免后续生成的 image_output_N 与已存在节点重名
      let maxAssetSeq = 0
      for (const n of rebuilt) {
        if (n.type !== 'assetNode') continue
        const name = (n.data as AssetNodeData | undefined)?.name ?? ''
        const m = /^image_output_(\d+)$/.exec(name)
        if (m) maxAssetSeq = Math.max(maxAssetSeq, Number(m[1]))
      }
      assetNameCounter.current = Math.max(assetNameCounter.current, maxAssetSeq)
    },
    [handleChangeValue, handleRun, buildAssetData, buildArrayData, buildPromptBatchData, buildLoopData, buildLoopParamOptions, buildMultiImageOutputData, buildVideoOutputData, handleRenameGroup, handleDeleteGroup, handleArrangeGroup, setNodes, setEdges, setGroups]
  )

  const openProject = useCallback(
    async (id: string) => {
      try {
        const project = await comfyuiProjectApi.get(id)
        setCurrentProjectId(project.id); currentProjectIdRef.current = project.id
        setCurrentProjectName(project.name)
        setStoredComfyProjectId(project.id)
        setActiveEditAssetId(null)
        setActiveEditSourceUrl(null)
        activeEditSourceUrlRef.current = null
        setPendingEditImage(null)
        rebuildGraph(project.graphJson)
        void navigate({ to: '/canvas/comfyui', search: { project: project.id }, replace: true })
        toast.success(`已打开项目：${project.name}`)
      } catch (e) {
        toast.error(`打开失败：${e instanceof Error ? e.message : '未知错误'}`)
      }
    },
    [rebuildGraph, navigate]
  )

  const createProject = useCallback(
    async (name: string) => {
      try {
        const project = await comfyuiProjectApi.create(name, '{"nodes":[],"edges":[]}')
        setCurrentProjectId(project.id); currentProjectIdRef.current = project.id
        setCurrentProjectName(project.name)
        setStoredComfyProjectId(project.id)
        setActiveEditAssetId(null)
        setActiveEditSourceUrl(null)
        activeEditSourceUrlRef.current = null
        setPendingEditImage(null)
        valuesRef.current = {}
        setNodes([])
        setEdges([])
        setSelectedNodeId(null)
        await refreshProjects()
        void navigate({ to: '/canvas/comfyui', search: { project: project.id }, replace: true })
        toast.success(`已创建项目：${project.name}`)
      } catch (e) {
        toast.error(`创建失败：${e instanceof Error ? e.message : '未知错误'}`)
      }
    },
    [refreshProjects, setNodes, setEdges, navigate]
  )

  const saveProject = useCallback(async () => {
    if (!currentProjectId) {
      toast.info('请先新建或打开一个项目')
      return
    }
    setSaving(true)
    try {
      const snapshot = serializeGraph()
      await comfyuiProjectApi.save(currentProjectId, snapshot, currentProjectName)
      lastSavedRef.current = snapshot
      await refreshProjects()
      toast.success('项目已保存')
    } catch (e) {
      toast.error(`保存失败：${e instanceof Error ? e.message : '未知错误'}`)
    } finally {
      setSaving(false)
    }
  }, [currentProjectId, currentProjectName, serializeGraph, refreshProjects])

  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedRef = useRef<string>('')

  useEffect(() => {
    if (!currentProjectId) return
    const snapshot = serializeGraph()
    if (snapshot === lastSavedRef.current) return
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => {
      void (async () => {
        try {
          await comfyuiProjectApi.save(currentProjectId, snapshot, currentProjectName)
          lastSavedRef.current = snapshot
        } catch {
          // 自动保存失败时静默处理，用户仍可手动保存
        }
      })()
    }, 1500)
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    }
  }, [nodes, edges, currentProjectId, currentProjectName, serializeGraph])

  const deleteProject = useCallback(
    async (id: string) => {
      try {
        await comfyuiProjectApi.delete(id)
        if (id === currentProjectId) {
          removeStoredComfyProjectId()
          setCurrentProjectId(null); currentProjectIdRef.current = null
          setCurrentProjectName('')
          setActiveEditAssetId(null)
          setActiveEditSourceUrl(null)
          activeEditSourceUrlRef.current = null
          setPendingEditImage(null)
          setNodes([])
          setEdges([])
        }
        await refreshProjects()
        toast.success('项目已删除')
      } catch (e) {
        toast.error(`删除失败：${e instanceof Error ? e.message : '未知错误'}`)
      }
    },
    [currentProjectId, refreshProjects, setNodes, setEdges]
  )

  useEffect(() => {
    void refreshWorkflows()
    void refreshProjects()
    void refreshImportedWorkflows()
  }, [refreshWorkflows, refreshProjects, refreshImportedWorkflows])

  const openedProjectRef = useRef<string | null>(null)
  useEffect(() => {
    const targetProjectId = routeProjectId ?? getStoredComfyProjectId()
    if (!targetProjectId || openedProjectRef.current === targetProjectId) return
    openedProjectRef.current = targetProjectId
    void openProject(targetProjectId)
  }, [routeProjectId, openProject])

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId && n.type === 'workflowNode'),
    [nodes, selectedNodeId]
  )
  const selectedData = selectedNode?.data as WorkflowNodeData | undefined

  const selectedAsset = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId && n.type === 'assetNode'),
    [nodes, selectedNodeId]
  )
  const selectedAssetData = selectedAsset?.data as AssetNodeData | undefined

  return (
    <ProjectIdProvider projectId={currentProjectId ?? undefined}>
    <div className="flex h-full min-h-0 overflow-hidden bg-neutral-50">
      <ImageEditPanel
        workflows={importedWorkflows}
        localWorkflows={localWorkflows}
        collapsed={editPanelCollapsed}
        onToggle={() => setEditPanelCollapsed((v) => !v)}
        pendingImage={pendingEditImage}
        onPendingHandled={() => setPendingEditImage(null)}
        onEdited={handleEditedVersion}
        onAfterImport={() => void refreshImportedWorkflows()}
        editingAsset={editingAsset}
        onSelectVersion={handleSelectAssetVersion}
        onPreview={(url) => { setPreviewUrls([url]); setPreviewIndex(0) }}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <ProjectBar
          projects={projects}
          currentProjectId={currentProjectId}
          currentProjectName={currentProjectName}
          saving={saving}
          onCreate={createProject}
          onOpen={openProject}
          onSave={saveProject}
          onDelete={deleteProject}
          onRenameCurrent={setCurrentProjectName}
        />

        <div className="flex items-start gap-2 border-b border-neutral-200 bg-white px-4 py-2">
          <div className="max-h-[72px] flex-1 overflow-y-auto py-0.5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <div className="flex items-center gap-1.5">
                <span className="shrink-0 text-[11px] font-semibold text-neutral-400">节点</span>
                <button
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/comfy-node', JSON.stringify({ kind: 'videoOutput' }))
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                  onClick={() => addVideoOutputNode({ x: 760, y: 220 })}
                  title="拖拽或点击添加视频输出节点，用于接收视频工作流结果"
                  className="flex shrink-0 cursor-grab items-center gap-1 rounded-md border border-dashed border-rose-300 bg-rose-50 px-2 py-1 text-[11px] text-rose-700 transition-colors hover:border-rose-700 hover:bg-rose-100 active:cursor-grabbing"
                >
                  <FileVideo size={11} />
                  <span>视频输出</span>
                </button>
                <button
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/comfy-node', JSON.stringify({ kind: 'array' }))
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                  onClick={() => addArrayNode({ x: 120, y: 160 })}
                  title="拖拽或点击添加数组节点，连接到循环节点作为入参"
                  className="flex shrink-0 cursor-grab items-center gap-1 rounded-md border border-dashed border-violet-300 bg-violet-50 px-2 py-1 text-[11px] text-violet-700 transition-colors hover:border-violet-700 hover:bg-violet-100 active:cursor-grabbing"
                >
                  <ListTree size={11} />
                  <span>数组节点</span>
                </button>
                <button
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/comfy-node', JSON.stringify({ kind: 'asset' }))
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                  onClick={() => addAssetNode({ x: 200, y: 120 })}
                  title="拖拽或点击添加图片输出节点"
                  className="flex shrink-0 cursor-grab items-center gap-1 rounded-md border border-dashed border-neutral-300 bg-neutral-50 px-2 py-1 text-[11px] text-neutral-600 transition-colors hover:border-neutral-900 hover:bg-neutral-100 active:cursor-grabbing"
                >
                  <ImageIcon size={11} />
                  <span>图片输出</span>
                </button>
                <button
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/comfy-node', JSON.stringify({ kind: 'loop' }))
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                  onClick={() => addLoopNode({ x: 180, y: 140 })}
                  title="拖拽或点击添加循环节点，工作流可拖入其中循环执行"
                  className="flex shrink-0 cursor-grab items-center gap-1 rounded-md border border-dashed border-amber-300 bg-amber-50 px-2 py-1 text-[11px] text-amber-700 transition-colors hover:border-amber-700 hover:bg-amber-100 active:cursor-grabbing"
                >
                  <GitBranch size={11} />
                  <span>循环节点</span>
                </button>
                <button
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/comfy-node', JSON.stringify({ kind: 'multiImageOutput' }))
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                  onClick={() => addMultiImageOutputNode({ x: 680, y: 180 })}
                  title="拖拽或点击添加多图输出节点，用于接收循环结果"
                  className="flex shrink-0 cursor-grab items-center gap-1 rounded-md border border-dashed border-blue-300 bg-blue-50 px-2 py-1 text-[11px] text-blue-700 transition-colors hover:border-blue-700 hover:bg-blue-100 active:cursor-grabbing"
                >
                  <Grid2x2 size={11} />
                  <span>多图输出</span>
                </button>
                <button
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/comfy-node', JSON.stringify({ kind: 'promptBatch' }))
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                  onClick={() => addPromptBatchNode({ x: 240, y: 160 })}
                  title="兼容旧版：添加多提示词输出节点"
                  className="flex shrink-0 cursor-grab items-center gap-1 rounded-md border border-dashed border-slate-300 bg-slate-50 px-2 py-1 text-[11px] text-slate-600 transition-colors hover:border-slate-700 hover:bg-slate-100 active:cursor-grabbing"
                >
                  <Grid2x2 size={11} />
                  <span>多提示词旧版</span>
                </button>
              </div>

              <div className="h-5 w-px shrink-0 bg-neutral-200" />

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setWorkflowListCollapsed((v) => !v)}
                  className="flex shrink-0 items-center gap-1 text-[11px] font-semibold text-neutral-400 transition-colors hover:text-neutral-900"
                  title="展开或折叠已导入工作流模板"
                >
                  {workflowListCollapsed ? <ChevronRight size={11} /> : <ChevronDown size={11} />}
                  <span>工作流模板</span>
                </button>
                {!workflowListCollapsed && importedWorkflows.map((wf) => (
                  <button
                    key={wf.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData(
                        'application/comfy-node',
                        JSON.stringify({ kind: 'workflow', workflow: wf })
                      )
                      e.dataTransfer.effectAllowed = 'move'
                    }}
                    onClick={() => void addWorkflowNode(wf)}
                    title={`拖拽或点击添加：${formatWorkflowName(wf.name)}，参数来自已导入模板`}
                    className="flex shrink-0 cursor-grab items-center gap-1 rounded-md border border-neutral-200 bg-white px-2 py-1 text-[11px] text-neutral-600 transition-colors hover:border-neutral-900 hover:bg-neutral-900 hover:text-white active:cursor-grabbing"
                  >
                    <Plus size={11} />
                    <span className="max-w-[110px] truncate">{formatWorkflowName(wf.name)}</span>
                    <span className="text-[10px] opacity-60">{parseParams(wf.paramSchema).length}</span>
                  </button>
                ))}
                {!workflowListCollapsed && importedWorkflows.length === 0 && (
                  <span className="rounded-md border border-dashed border-neutral-200 bg-neutral-50 px-2 py-1 text-[11px] text-neutral-400">
                    请先在工作流测试导入模板
                  </span>
                )}
              </div>

              <div className="h-5 w-px shrink-0 bg-neutral-200" />

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="shrink-0 text-[11px] font-semibold text-neutral-400">分组</span>
                <button
                  onClick={handleCreateGroup}
                  title="框选多个节点后，点击创建分组"
                  className="flex shrink-0 cursor-pointer items-center gap-1 rounded-md border border-violet-200 bg-violet-50 px-2 py-1 text-[11px] text-violet-600 transition-colors hover:border-violet-500 hover:bg-violet-100"
                >
                  <Layers size={11} />
                  <span>成组</span>
                </button>
                {groups.length > 0 && (
                  <button
                    onClick={() => {
                      if (selectedNodeIds.length === 1) {
                        const nodeId = selectedNodeIds[0]
                        const group = groups.find((g) => g.childIds.includes(nodeId))
                        if (group) handleDeleteGroup(group.id)
                      } else {
                        toast.info('请先选择一个已分组的节点')
                      }
                    }}
                    title="取消分组"
                    className="flex shrink-0 cursor-pointer items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-600 transition-colors hover:border-slate-500 hover:bg-slate-100"
                  >
                    <Ungroup size={11} />
                    <span>取消</span>
                  </button>
                )}
              </div>
            </div>
          </div>
          <Button
            onClick={() => void refreshImportedWorkflows()}
            size="sm"
            variant="ghost"
            className="h-7 shrink-0 text-neutral-500"
          >
            <RefreshCw size={14} className="mr-1" /> 刷新模板
          </Button>
        </div>

        <div className="relative min-h-0 flex-1">
          <MultiSelectContext.Provider value={selectedNodeIds.length > 1}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onNodeDrag={onNodeDrag}
            onNodeDragStop={onNodeDragStop}
            onNodeContextMenu={onNodeContextMenu}
            onPaneClick={() => setSelectedNodeId(null)}
            onSelectionChange={({ nodes: selected }) => {
              if (selectedNodeIds.length !== selected.length) {
                setSelectedNodeIds(selected.map((n) => n.id))
              }
            }}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            fitView
            // 缩放范围：ReactFlow 默认 minZoom=0.5、maxZoom=2 —— 对多输出/大量节点的画布不够用
            // 放宽到 minZoom=0.05（可缩到 1/20 大小，鸟瞰全局），maxZoom=4（放大细看单张图）
            minZoom={0.05}
            maxZoom={4}
            className="bg-white"
            defaultEdgeOptions={{ animated: true, style: { stroke: '#171717', strokeWidth: 2 } }}
            selectionKeyCode="Shift"
            // 选择模式：Partial（默认）= 只要选择框碰到节点就选中；
            // 松手后 ReactFlow 会自动生成 nodesselection-rect 覆盖所有被选中节点的 bounding box。
            // 视觉外框由 CSS ::before 在 nodesselection-rect 上外扩 22px 承担，一定能包住所有节点视觉边缘。
            selectionMode={SelectionMode.Partial}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#d4d4d4" />
            <MiniMap
              position='bottom-right'
              pannable
              zoomable
              nodeStrokeWidth={2}
              nodeStrokeColor={(n) => {
                if (n.type === 'workflowNode') return '#171717'
                if (n.type === 'assetNode') return '#a3a3a3'
                if (n.type === 'multiImageOutputNode') return '#737373'
                if (n.type === 'videoOutputNode') return '#525252'
                if (n.type === 'loopNode' || n.type === 'groupNode') return '#94a3b8'
                return '#d4d4d4'
              }}
              nodeColor={(n) => {
                if (n.type === 'workflowNode') return '#171717'
                if (n.type === 'assetNode') return '#e5e5e5'
                if (n.type === 'multiImageOutputNode') return '#d4d4d4'
                if (n.type === 'videoOutputNode') return '#a3a3a3'
                if (n.type === 'loopNode' || n.type === 'groupNode') return '#f1f5f9'
                return '#f5f5f5'
              }}
              maskColor='rgba(23,23,23,0.08)'
              style={{
                width: 180,
                height: 130,
                background: 'white',
                border: '1px solid #e5e5e5',
                borderRadius: 8,
                boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
              }}
            />
            <HelperLinesRenderer horizontal={helperLines.horizontal} vertical={helperLines.vertical} />
            <SelectionOverlay />
            {nodes.length === 0 && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2 text-neutral-300">
                  <FolderOpen size={40} />
                  <p className="text-sm">
                    {currentProjectId ? '从顶部拖拽工作流或输出节点到画布' : '新建或打开一个项目开始创作'}
                  </p>
                </div>
              </div>
            )}
          </ReactFlow>
          </MultiSelectContext.Provider>
        </div>
      </div>

      {selectedData && (
        <PropertyPanel
          title={selectedData.name}
          params={selectedData.params as ComfyParam[]}
          values={selectedData.values}
          running={selectedData.running}
          onChange={(key, value) => handleChangeValue(selectedData.nodeId, key, value)}
          onRun={() => void handleRun(selectedData.nodeId)}
          onClose={() => setSelectedNodeId(null)}
        />
      )}

      {selectedAsset && selectedAssetData && (
        <AssetPropertyPanel
          name={selectedAssetData.name}
          urls={selectedAssetData.urls}
          displayMode={selectedAssetData.displayMode}
          locked={selectedAssetData.locked}
          prompt={selectedAssetData.prompt}
          aspectRatio={selectedAssetData.aspectRatio}
          params={selectedAssetData.params}
          onRename={(name) => handleAssetRename(selectedAsset.id, name)}
          onToggleMode={() => handleAssetToggleMode(selectedAsset.id)}
          onToggleLock={() => handleAssetToggleLock(selectedAsset.id)}
          onRemoveImage={(url) => handleAssetRemoveImage(selectedAsset.id, url)}
          onClearAll={() => handleAssetClearAll(selectedAsset.id)}
          onClose={() => setSelectedNodeId(null)}
        />
      )}

      {contextMenu && (
        <NodeContextMenu
          menu={contextMenu}
          onRun={(id) => {
            const target = nodesRef.current.find((n) => n.id === id)
            if (target?.type === 'promptBatchNode') {
              void handleRunPromptBatch(id)
            } else if (target?.type === 'loopNode') {
              void handleRunLoop(id)
            } else {
              void handleRun(id)
            }
          }}
          onEdit={(id) => setSelectedNodeId(id)}
          onDuplicate={handleDuplicateNode}
          onDelete={(id) => {
            const target = nodesRef.current.find((n) => n.id === id)
            if (target?.type === 'assetNode') {
              void handleDeleteAssetNode(id)
            } else {
              void handleDeleteNode(id)
            }
          }}
          onClose={() => setContextMenu(null)}
        />
      )}

      {previewUrls.length > 0 && (() => {
        const currentUrl = previewUrls[previewIndex]
        const hasPrev = previewIndex > 0
        const hasNext = previewIndex < previewUrls.length - 1
        const goPrev = () => setPreviewIndex(previewIndex - 1)
        const goNext = () => setPreviewIndex(previewIndex + 1)
        return (
          <div
            onClick={() => setPreviewUrls([])}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-8 backdrop-blur-sm"
          >
            <button
              onClick={() => setPreviewUrls([])}
              className="absolute right-5 top-5 z-10 flex size-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              title="关闭"
            >
              <X size={18} />
            </button>
            {previewUrls.length > 1 && (
              <div className="absolute top-5 left-1/2 -translate-x-1/2 z-10 rounded-full bg-white/10 px-3 py-1 text-xs text-white/80 backdrop-blur-sm">
                {previewIndex + 1} / {previewUrls.length}
              </div>
            )}
            {hasPrev && (
              <button
                onClick={(e) => { e.stopPropagation(); goPrev() }}
                className="absolute left-4 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
              >
                <ChevronLeft size={22} />
              </button>
            )}
            {hasNext && (
              <button
                onClick={(e) => { e.stopPropagation(); goNext() }}
                className="absolute right-4 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
              >
                <ChevronRight size={22} />
              </button>
            )}
            {isVideoUrl(currentUrl) ? (
              <video
                key={currentUrl}
                src={currentUrl}
                controls
                autoPlay
                onClick={(e) => e.stopPropagation()}
                className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
              />
            ) : (
              <img
                key={currentUrl}
                src={currentUrl}
                alt="预览"
                onClick={(e) => e.stopPropagation()}
                className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
              />
            )}
          </div>
        )
      })()}
    </div>
    </ProjectIdProvider>
  )
}

export function ComfyUIPage({ projectId }: { projectId?: string }) {
  return (
    <ReactFlowProvider>
      <ComfyUICanvasInner routeProjectId={projectId} />
    </ReactFlowProvider>
  )
}

export { WorkflowTestPage } from './components/WorkflowTestPage'
