/** Zustand 全局状态：项目管理 + 画布节点/边 + WS 事件处理。 */
import { create } from 'zustand'
import type { Edge, Node } from '@xyflow/react'
import type { Asset, AssetType, DirectorStageScreenshot, Episode, FreeNodeData, ProjectDetail, ProjectListItem, Storyboard, Video, WsEvent } from '../types'
import { directorStagesApi, projectsApi, scriptApi, storyboardsApi } from '../api'
import { connectWs, disconnectWs } from '../ws'
import { computeAssetPosition, computeProjectLayout, computeStoryboardPosition } from '../utils/canvasLayout'

interface CanvasState {
  // 项目
  projects: ProjectListItem[]
  currentProject: ProjectDetail | null
  loading: boolean

  // 画布
  nodes: Node[]
  edges: Edge[]

  // 全局错误提示
  globalError: string | null

  // 工作流状态
  workflowStatus: string | null

  // 节点弹出动画计数器
  appearCounter: number

  // 操作
  loadProjects: () => Promise<void>
  selectProject: (id: string) => Promise<void>
  createProject: (name: string) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  renameProject: (id: string, name: string) => Promise<void>
  pinProject: (id: string, pinned: boolean) => Promise<void>
  uploadScript: (text: string) => Promise<void>
  handleWsEvent: (event: WsEvent) => void
  setNodes: (nodes: Node[] | ((n: Node[]) => Node[])) => void
  setEdges: (edges: Edge[] | ((e: Edge[]) => Edge[])) => void
  saveCanvas: () => void
  setGlobalError: (error: string | null) => void
  setWorkflowStatus: (status: string | null) => void
  deleteNode: (id: string) => void
  duplicateNode: (id: string) => void

  // 导演台
  createDirectorStage: (position: { x: number; y: number }) => Promise<void>
  updateDirectorStageNode: (stageId: string, patch: any) => void
  addReferenceImageNode: (stageId: string, screenshot: DirectorStageScreenshot) => void
  updateStoryboardRefs: (storyboardId: string, refIds: string[]) => Promise<void>
  syncStoryboardReferenceEdges: () => void

  // 自由节点
  addFreeNode: (position: { x: number; y: number }, contentType: FreeNodeData['contentType']) => void
  addScriptNode: (position: { x: number; y: number }) => void

  // 导演台编辑器弹窗
  directorStageEditorOpen: boolean
  directorStageEditorId: string | null
  openDirectorStageEditor: (id: string) => void
  closeDirectorStageEditor: () => void
}

let saveTimer: ReturnType<typeof setTimeout> | null = null

export const useStore = create<CanvasState>((set, get) => ({
  projects: [],
  currentProject: null,
  loading: false,
  nodes: [],
  edges: [],
  globalError: null,
  workflowStatus: null,
  appearCounter: 0,

  directorStageEditorOpen: false,
  directorStageEditorId: null,

  loadProjects: async () => {
    const list = await projectsApi.list()
    set({ projects: list })
  },

  selectProject: async (id) => {
    set({ loading: true })
    disconnectWs()
    try {
      const proj = await projectsApi.get(id)
      set({ currentProject: proj, loading: false, appearCounter: 0 })
      // 始终以项目数据为权威重建节点，但保留 canvas_state 中的用户位置
      rebuildCanvasFromProject(proj, set, get, proj.canvas_state)
      get().syncStoryboardReferenceEdges()
      connectWs(id, get().handleWsEvent)
    } catch (e) {
      console.error('加载项目失败:', e)
      set({ loading: false })
    }
  },

  createProject: async (name) => {
    const proj = await projectsApi.create(name)
    await get().loadProjects()
    await get().selectProject(proj.id)
  },

  deleteProject: async (id) => {
    await projectsApi.delete(id)
    const wasCurrent = get().currentProject?.id === id
    await get().loadProjects()
    if (wasCurrent) {
      set({ currentProject: null, nodes: [], edges: [] })
    }
  },

  renameProject: async (id, name) => {
    await projectsApi.update(id, { name })
    await get().loadProjects()
    set((state) => ({
      currentProject: state.currentProject?.id === id
        ? { ...state.currentProject, name }
        : state.currentProject,
    }))
  },

  pinProject: async (id, pinned) => {
    await projectsApi.update(id, { pinned })
    await get().loadProjects()
  },

  uploadScript: async (text) => {
    const proj = get().currentProject
    if (!proj) throw new Error('未选择项目')
    set({ workflowStatus: 'script_analyzing' })
    try {
      await scriptApi.upload(proj.id, text)
    } catch (e) {
      set({ workflowStatus: null })
      throw e
    }
    // WS 事件会驱动画布更新
  },

  handleWsEvent: (event) => {
    switch (event.event) {
      case 'workflow_started':
        set({ workflowStatus: 'workflow_started' })
        break
      case 'status':
        set({ workflowStatus: event.stage })
        break
      case 'script_analyzed':
        handleScriptAnalyzed(event, set, get)
        break
      case 'asset_prompt_done':
        updateAssetNode(event.asset_type, event.asset_id, { prompt: event.prompt }, set)
        break
      case 'asset_generating':
        updateAssetNode(event.asset_type, event.asset_id, { status: 'generating' }, set)
        break
      case 'asset_generated':
        updateAssetNode(event.asset_type, event.asset_id, { status: 'done', image_path: event.image_path }, set)
        break
      case 'asset_failed':
        updateAssetNode(event.asset_type, event.asset_id, { status: 'failed', error: event.message }, set)
        break
      case 'storyboard_prompt_done':
        addStoryboardNode(event, set, get)
        get().syncStoryboardReferenceEdges()
        break
      case 'storyboard_generating':
        updateStoryboardNode(event.storyboard_id, { status: 'generating' }, set)
        break
      case 'storyboard_generated':
        updateStoryboardNode(event.storyboard_id, { status: 'done', image_path: event.image_path, image_url: event.image_url }, set)
        break
      case 'storyboard_failed':
        updateStoryboardNode(event.storyboard_id, { status: 'failed', error: event.message }, set)
        break
      case 'video_creating':
        addVideoNode(event, set, get)
        break
      case 'video_progress':
        updateVideoNode(event.video_id, { progress: event.progress, status: 'generating' }, set)
        break
      case 'video_done':
        updateVideoNode(event.video_id, { status: 'done', video_path: event.video_path, video_url: event.video_url }, set)
        break
      case 'video_failed':
        updateVideoNode(event.video_id, { status: 'failed', error: event.message }, set)
        break
      case 'workflow_done':
        set({ workflowStatus: null })
        break
      case 'error':
        console.error('Agent 错误:', event.stage, event.message)
        set({ globalError: `Agent 错误 [${event.stage}]: ${event.message}`, workflowStatus: null })
        break
    }
  },

  setGlobalError: (error) => set({ globalError: error }),
  setWorkflowStatus: (status) => set({ workflowStatus: status }),

  setNodes: (updater) => {
    set((state) => ({
      nodes: typeof updater === 'function' ? (updater as (n: Node[]) => Node[])(state.nodes) : updater,
    }))
    scheduleSave(get)
  },

  setEdges: (updater) => {
    set((state) => ({
      edges: typeof updater === 'function' ? (updater as (e: Edge[]) => Edge[])(state.edges) : updater,
    }))
    scheduleSave(get)
  },

  deleteNode: (id) => {
    set((state) => ({
      nodes: state.nodes.filter(n => n.id !== id),
      edges: state.edges.filter(e => e.source !== id && e.target !== id),
    }))
    scheduleSave(get)
  },

  duplicateNode: (id) => {
    const node = get().nodes.find(n => n.id === id)
    if (!node) return
    const newId = `${node.type}-${crypto.randomUUID().slice(0, 8)}`
    const newNode: Node = {
      ...node,
      id: newId,
      position: { x: node.position.x + 40, y: node.position.y + 40 },
      data: { ...node.data, appearIndex: get().appearCounter },
      selected: false,
    }
    set((state) => ({
      nodes: [...state.nodes, newNode],
      appearCounter: state.appearCounter + 1,
    }))
    scheduleSave(get)
  },

  saveCanvas: () => {
    const proj = get().currentProject
    if (!proj) return
    projectsApi.saveCanvas(proj.id, { nodes: get().nodes, edges: get().edges })
  },

  createDirectorStage: async (position) => {
    const proj = get().currentProject
    if (!proj) return
    try {
      const ds = await directorStagesApi.create(proj.id, '导演台')
      const newNode: Node = {
        id: `ds-${ds.id}`,
        type: 'director_stage',
        position,
        data: { ...ds, appearIndex: get().appearCounter },
      }
      set((state) => ({
        nodes: [...state.nodes, newNode],
        appearCounter: state.appearCounter + 1,
        currentProject: state.currentProject
          ? { ...state.currentProject, director_stages: [...state.currentProject.director_stages, ds] }
          : null,
      }))
    } catch (e) {
      console.error('创建导演台失败:', e)
      set({ globalError: '创建导演台失败' })
    }
  },

  addFreeNode: (position, contentType) => {
    const id = crypto.randomUUID()
    const titles: Record<FreeNodeData['contentType'], string> = {
      text: '文本',
      image: '图片',
      video: '视频',
    }
    const newNode: Node = {
      id: `free-${id}`,
      type: 'free_node',
      position,
      data: {
        id,
        contentType,
        title: titles[contentType],
        content: contentType === 'text' ? '双击编辑文本' : undefined,
        src: null,
        status: 'user_edited',
        appearIndex: get().appearCounter,
      } as Record<string, unknown>,
    }
    set((state) => ({
      nodes: [...state.nodes, newNode],
      appearCounter: state.appearCounter + 1,
    }))
  },

  addScriptNode: (position) => {
    const proj = get().currentProject
    const newNode: Node = {
      id: `script-${crypto.randomUUID().slice(0, 8)}`,
      type: 'script',
      position,
      data: {
        projectId: proj?.id,
        hasScript: false,
        appearIndex: get().appearCounter,
      } as Record<string, unknown>,
    }
    set((state) => ({
      nodes: [...state.nodes, newNode],
      appearCounter: state.appearCounter + 1,
    }))
    scheduleSave(get)
  },

  updateDirectorStageNode: (stageId, patch) => {
    set((state) => ({
      nodes: state.nodes.map(n => {
        if (n.id === `ds-${stageId}`) {
          return { ...n, data: { ...n.data, ...patch } }
        }
        return n
      }),
      currentProject: state.currentProject
        ? {
            ...state.currentProject,
            director_stages: state.currentProject.director_stages.map(ds =>
              ds.id === stageId ? { ...ds, ...patch } : ds
            ),
          }
        : null,
    }))
  },

  addReferenceImageNode: (stageId, screenshot) => {
    const stageNode = get().nodes.find(n => n.id === `ds-${stageId}`)
    if (!stageNode) return
    const refId = `ref-${screenshot.id}`
    if (get().nodes.find(n => n.id === refId)) return
    const existingRefs = get().nodes.filter(n =>
      n.type === 'reference_image' &&
      (n.data as any)?.director_stage_id === stageId
    ).length
    const newNode: Node = {
      id: refId,
      type: 'reference_image',
      position: { x: stageNode.position.x + 320, y: stageNode.position.y + existingRefs * 160 },
      data: {
        id: screenshot.id,
        name: screenshot.filename,
        image_path: screenshot.image_path,
        director_stage_id: stageId,
        appearIndex: get().appearCounter,
      },
    }
    const newEdge: Edge = {
      id: `e-ds-${stageId}-ref-${screenshot.id}`,
      source: `ds-${stageId}`,
      target: refId,
      type: 'default',
      style: { stroke: '#9ca3af', strokeWidth: 1.5, strokeDasharray: '5,5' },
    }
    set((state) => ({
      nodes: [...state.nodes, newNode],
      edges: [...state.edges, newEdge],
      appearCounter: state.appearCounter + 1,
    }))
    scheduleSave(get)
  },

  updateStoryboardRefs: async (storyboardId, refIds) => {
    set((state) => ({
      nodes: state.nodes.map(n => {
        if (n.id === `sb-${storyboardId}`) {
          return { ...n, data: { ...n.data, director_stage_ref_ids: refIds } }
        }
        return n
      }),
    }))
    await storyboardsApi.update(storyboardId, { director_stage_ref_ids: refIds })
    get().syncStoryboardReferenceEdges()
  },

  syncStoryboardReferenceEdges: () => {
    const state = get()
    const storyboardNodes = state.nodes.filter(n => n.type === 'storyboard')
    const refNodes = state.nodes.filter(n => n.type === 'reference_image')
    const refNodeIds = new Set(refNodes.map(n => n.id))

    // 先移除所有 reference_image -> storyboard 的引用边
    let newEdges = state.edges.filter(e => {
      const isRefEdge = refNodeIds.has(e.source) && storyboardNodes.some(n => n.id === e.target)
      return !isRefEdge
    })

    // 根据当前 director_stage_ref_ids 重新添加
    storyboardNodes.forEach(sbNode => {
      const sbData = sbNode.data as any
      const refIds = (sbData?.director_stage_ref_ids || []) as string[]
      refIds.forEach(refId => {
        const refNodeId = `ref-${refId}`
        if (refNodeIds.has(refNodeId)) {
          newEdges.push({
            id: `e-ref-${refId}-sb-${sbData?.id}`,
            source: refNodeId,
            target: sbNode.id,
            type: 'default',
            style: { stroke: '#9ca3af', strokeWidth: 1.5, strokeDasharray: '5,5' },
          })
        }
      })
    })

    set({ edges: newEdges })
    scheduleSave(get)
  },

  openDirectorStageEditor: (id) => set({ directorStageEditorOpen: true, directorStageEditorId: id }),
  closeDirectorStageEditor: () => set({ directorStageEditorOpen: false, directorStageEditorId: null }),
}))

// ---------- 布局与节点管理辅助 ----------

function scheduleSave(get: () => CanvasState) {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => get().saveCanvas(), 1000)
}

function rebuildCanvasFromProject(
  proj: ProjectDetail,
  set: any,
  get: () => CanvasState,
  canvasState?: { nodes?: any[]; edges?: any[] } | null,
) {
  const { nodes, edges, appearNext } = computeProjectLayout(proj, get().appearCounter)

  // canvas-only 节点类型：这些节点存在于 canvas_state，但不来自项目数据
  const CANVAS_ONLY_TYPES = new Set(['reference_image'])

  if (canvasState?.nodes?.length) {
    const positionMap = new Map(canvasState.nodes.map(n => [n.id, n.position]))
    // 应用保存的位置
    nodes.forEach(n => {
      const savedPos = positionMap.get(n.id)
      if (savedPos) {
        n.position = { ...savedPos }
      }
    })
    // 保留 canvas-only 节点（如参考图）
    const existingIds = new Set(nodes.map(n => n.id))
    canvasState.nodes.forEach((savedNode: any) => {
      if (savedNode.type && CANVAS_ONLY_TYPES.has(savedNode.type) && savedNode.id && !existingIds.has(savedNode.id)) {
        nodes.push(savedNode)
      }
    })
    // 合并 canvas_state 中额外的边（如参考图相关连线）
    const edgeIds = new Set(edges.map(e => e.id))
    ;(canvasState.edges || []).forEach(savedEdge => {
      if (!edgeIds.has(savedEdge.id)) {
        edges.push(savedEdge)
      }
    })
  }

  set({ nodes, edges, appearCounter: appearNext })
}

function handleScriptAnalyzed(event: WsEvent, set: any, get: () => CanvasState) {
  const current = get().currentProject
  if (!current) return

  const updatedProject: ProjectDetail = {
    ...current,
    characters: event.characters ?? current.characters ?? [],
    scenes: event.scenes ?? current.scenes ?? [],
    props: event.props ?? current.props ?? [],
    episodes: event.episodes ?? current.episodes ?? [],
  }

  // 保留已有的 canvas-only 节点（如参考图）和用户位置
  const prevCanvasState = { nodes: get().nodes, edges: get().edges }
  const { nodes, edges, appearNext } = computeProjectLayout(updatedProject, get().appearCounter)
  const CANVAS_ONLY_TYPES = new Set(['reference_image'])
  const existingIds = new Set(nodes.map(n => n.id))
  const positionMap = new Map(prevCanvasState.nodes.map(n => [n.id, n.position]))
  nodes.forEach(n => {
    const savedPos = positionMap.get(n.id)
    if (savedPos) n.position = { ...savedPos }
  })
  prevCanvasState.nodes.forEach((n: any) => {
    if (n.type && CANVAS_ONLY_TYPES.has(n.type) && n.id && !existingIds.has(n.id)) nodes.push(n)
  })
  const edgeIds = new Set(edges.map(e => e.id))
  prevCanvasState.edges.forEach(e => {
    if (!edgeIds.has(e.id)) edges.push(e)
  })

  set({ currentProject: updatedProject, nodes, edges, appearCounter: appearNext })
}

function addStoryboardNode(event: WsEvent, set: any, get: () => CanvasState) {
  const sbId = event.storyboard_id as string
  const epId = event.episode_id as string
  const sbIndex = event.index as number

  set((state: CanvasState) => {
    if (state.nodes.find(n => n.id === `sb-${sbId}`)) return state

    const pos = computeStoryboardPosition(epId, sbIndex, state.nodes)
    const appearIndex = state.appearCounter
    const newNode: Node = {
      id: `sb-${sbId}`,
      type: 'storyboard',
      position: pos,
      data: {
        id: sbId,
        index: sbIndex,
        prompt: event.prompt,
        image_path: null,
        status: 'pending',
        episode_id: epId,
        episode_index: event.episode_index,
        appearIndex,
      },
    }

    const newEdges = [...state.edges]
    // 分集 -> 故事板
    newEdges.push({
      id: `e-ep-${epId}-sb-${sbId}`,
      source: `ep-${epId}`,
      target: `sb-${sbId}`,
      type: 'default',
      style: { stroke: '#64748b', strokeWidth: 1.5 },
    })
    // 前一故事板 -> 当前故事板
    if (event.prev_storyboard_id) {
      newEdges.push({
        id: `e-prev-${sbId}`,
        source: `sb-${event.prev_storyboard_id}`,
        target: `sb-${sbId}`,
        type: 'default',
        animated: true,
        style: { stroke: '#64748b', strokeWidth: 1.5 },
      })
    }

    return { nodes: [...state.nodes, newNode], edges: newEdges, appearCounter: appearIndex + 1 }
  })
}

function updateAssetNode(assetType: string, assetId: string, patch: any, set: any) {
  set((state: CanvasState) => ({
    nodes: state.nodes.map(n => {
      if (n.id === `${assetType === 'character' ? 'char' : assetType}-${assetId}`) {
        return { ...n, data: { ...n.data, ...patch } }
      }
      return n
    }),
  }))
}

function updateStoryboardNode(sbId: string, patch: any, set: any) {
  set((state: CanvasState) => ({
    nodes: state.nodes.map(n => {
      if (n.id === `sb-${sbId}`) {
        return { ...n, data: { ...n.data, ...patch } }
      }
      return n
    }),
  }))
}

function addVideoNode(event: WsEvent, set: any, get: () => CanvasState) {
  const videoId = event.video_id as string
  const storyboardId = event.storyboard_id as string

  set((state: CanvasState) => {
    // 已存在则跳过
    if (state.nodes.find(n => n.id === `vid-${videoId}`)) return state

    // 找到对应故事板节点，在其正下方放置视频节点
    const sbNode = state.nodes.find(n => n.id === `sb-${storyboardId}`)
    const SB_H = 260
    const GAP_Y = 80
    const vx = sbNode?.position.x ?? 2360
    const vy = (sbNode?.position.y ?? 0) + SB_H + GAP_Y

    const appearIndex = state.appearCounter
    const newNode: Node = {
      id: `vid-${videoId}`,
      type: 'video',
      position: { x: vx, y: vy },
      data: {
        id: videoId,
        storyboard_id: storyboardId,
        prompt: event.prompt ?? '',
        status: 'generating',
        progress: 0,
        video_path: null,
        video_url: null,
        error: null,
        appearIndex,
      },
    }

    const newEdges = [...state.edges]
    // storyboard -> video 垂直连线
    if (sbNode) {
      newEdges.push({
        id: `e-sb-${storyboardId}-vid-${videoId}`,
        source: `sb-${storyboardId}`,
        target: `vid-${videoId}`,
        sourceHandle: 'bottom',
        targetHandle: 'top',
        type: 'default',
        style: { stroke: '#9ca3af', strokeWidth: 1.5 },
      })
    }

    return { nodes: [...state.nodes, newNode], edges: newEdges, appearCounter: appearIndex + 1 }
  })
}

function updateVideoNode(videoId: string, patch: any, set: any) {
  set((state: CanvasState) => ({
    nodes: state.nodes.map(n => {
      if (n.id === `vid-${videoId}`) {
        return { ...n, data: { ...n.data, ...patch } }
      }
      return n
    }),
  }))
}
