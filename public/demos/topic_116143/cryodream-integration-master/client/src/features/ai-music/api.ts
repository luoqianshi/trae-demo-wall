import type { CustomNode, EdgeType } from '@/features/flow/types'
import { runFlow } from '@/features/flow/api/run-flow'
import { addProject, getWorkflow, listProjects, updateProject } from '@/features/projects/project-api'

interface WorkflowGraph {
  nodes: CustomNode[]
  edges: EdgeType[]
  viewport?: Record<string, unknown>
}

export interface AiMusicProject {
  id: string
  title: string
  description?: string
  style?: string
  mood?: string
  language?: string
  status?: string
  lyricWorkflowId?: string
  musicWorkflowId?: string
  currentLyric?: string
  createTime?: string
  updateTime?: string
}

export interface AiMusicLyricVersion {
  id?: string
  projectId: string
  name: string
  title: string
  color: string
  summary: string
  content: string
  versionNo?: number | string
  createTime?: string
  updateTime?: string
}

export interface AiMusicAudio {
  id?: string
  projectId: string
  audioUrl: string
  title?: string
  durationSeconds?: number
  styleTags?: string
  lyricsSummary?: string
  paramSnapshot?: string
  createTime?: string
  updateTime?: string
}

export interface PageResponse<T> {
  records: T[]
  total: number
  current: number
  size: number
}

interface FlowProjectCompat {
  id: string
  name: string
  description?: string
  scenario?: string
  status?: string
  lastWorkflowId?: string
  createTime?: string
  updateTime?: string
}

const AI_MUSIC_SCENARIOS = new Set(['音乐', 'AI音乐', 'AI音乐创作'])

const MUSIC_PROJECT_STORAGE_KEY = 'ai-music-projects'

const readLocalMusicProjects = (): Record<string, Partial<AiMusicProject>> => {
  try {
    return JSON.parse(localStorage.getItem(MUSIC_PROJECT_STORAGE_KEY) || '{}') as Record<string, Partial<AiMusicProject>>
  } catch {
    return {}
  }
}

const writeLocalMusicProject = (id: string, patch: Partial<AiMusicProject>) => {
  const current = readLocalMusicProjects()
  current[id] = { ...(current[id] ?? {}), ...patch }
  localStorage.setItem(MUSIC_PROJECT_STORAGE_KEY, JSON.stringify(current))
}

const removeLocalMusicProject = (id: string) => {
  const current = readLocalMusicProjects()
  delete current[id]
  localStorage.setItem(MUSIC_PROJECT_STORAGE_KEY, JSON.stringify(current))
}

const normalizeFromFlowProject = (project: FlowProjectCompat): AiMusicProject => {
  const local = readLocalMusicProjects()[project.id] ?? {}
  return {
    id: String(project.id),
    title: local.title || project.name,
    description: local.description || project.description || 'AI音乐创作项目',
    style: local.style || '流行 Pop',
    mood: local.mood || '温暖',
    language: local.language || '中文',
    status: project.status || 'draft',
    lyricWorkflowId: local.lyricWorkflowId || project.lastWorkflowId,
    musicWorkflowId: local.musicWorkflowId,
    currentLyric: local.currentLyric,
    createTime: project.createTime,
    updateTime: project.updateTime,
  }
}

const shouldUseFlowProjectFallback = (error: unknown) => {
  return error instanceof Error && /HTTP 404|404|Not Found|Nomessageavailable/i.test(error.message)
}

const request = async <T>(url: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
    ...options,
  })
  const result = (await response.json()) as { code: number; data: T; message?: string }
  if (!response.ok) {
    throw new Error(`${result.message || '请求失败'}（HTTP ${response.status}）`)
  }
  if (result.code !== 0) {
    throw new Error(result.message || '接口返回错误')
  }
  return result.data
}

const normalizeAiMusicProject = (project: AiMusicProject): AiMusicProject => ({
  ...project,
  id: String(project.id),
})

const isWorkflowGraph = (value: unknown): value is WorkflowGraph => {
  if (!value || typeof value !== 'object') return false
  const graph = value as Partial<WorkflowGraph>
  return Array.isArray(graph.nodes) && Array.isArray(graph.edges)
}

const findStartNodeId = (graph: WorkflowGraph) => {
  // 优先找 ObjectInput（对象输入工作流），其次找 ChatInput（聊天工作流）
  return graph.nodes.find((node) => node.data?.type === 'ObjectInput')?.id
    ?? graph.nodes.find((node) => node.data?.type === 'ChatInput')?.id
}

export const listAiMusicProjects = async () => {
  try {
    const page = await request<PageResponse<AiMusicProject>>('/api/aiMusic/project/list/page', {
      method: 'POST',
      body: JSON.stringify({ current: 1, pageSize: 100 }),
    })
    return { ...page, records: page.records.map(normalizeAiMusicProject) }
  } catch (error) {
    if (!shouldUseFlowProjectFallback(error)) throw error
    const page = await listProjects()
    return {
      records: page.records
        .filter((project) => AI_MUSIC_SCENARIOS.has(project.scenario || '') || project.name.includes('音乐'))
        .map((project) => normalizeFromFlowProject(project)),
      total: page.total,
      current: page.current,
      size: page.size,
    }
  }
}

export const addAiMusicProject = async (payload: Pick<AiMusicProject, 'title' | 'description' | 'style' | 'mood' | 'language' | 'lyricWorkflowId' | 'musicWorkflowId' | 'currentLyric'>) => {
  try {
    const id = await request<string>('/api/aiMusic/project/add', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return String(id)
  } catch (error) {
    if (!shouldUseFlowProjectFallback(error)) throw error
    const id = await addProject({
      name: payload.title,
      description: payload.description,
      icon: 'FolderKanban',
      color: 'blue',
      scenario: '音乐',
    })
    writeLocalMusicProject(id, { ...payload, id, status: 'draft' })
    return id
  }
}

export const updateAiMusicProject = async (payload: Partial<AiMusicProject> & { id: string }) => {
  try {
    return await request<boolean>('/api/aiMusic/project/update', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    if (!shouldUseFlowProjectFallback(error)) throw error
    writeLocalMusicProject(payload.id, payload)
    if (payload.title || payload.description) {
      await updateProject({ id: payload.id, name: payload.title, description: payload.description })
    }
    return true
  }
}

export const deleteAiMusicProject = async (id: string) => {
  try {
    return await request<boolean>('/api/aiMusic/project/delete', {
      method: 'POST',
      body: JSON.stringify({ id }),
    })
  } catch (error) {
    if (!shouldUseFlowProjectFallback(error)) throw error
    removeLocalMusicProject(id)
    return true
  }
}

export const listAiMusicLyricVersions = async (projectId: string) => {
  return request<AiMusicLyricVersion[]>('/api/aiMusic/lyric/version/list', {
    method: 'POST',
    body: JSON.stringify({ projectId }),
  })
}

export const addAiMusicLyricVersion = async (payload: Omit<AiMusicLyricVersion, 'id' | 'createTime' | 'updateTime'>) => {
  return request<string>('/api/aiMusic/lyric/version/add', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export const addAiMusicAudio = async (payload: Omit<AiMusicAudio, 'id' | 'createTime' | 'updateTime'>) => {
  return request<string>('/api/aiMusic/audio/add', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export const listAiMusicAudios = async (projectId: string) => {
  return request<AiMusicAudio[]>('/api/aiMusic/audio/list', {
    method: 'POST',
    body: JSON.stringify({ projectId }),
  })
}

export const deleteAiMusicAudio = async (id: string) => {
  return request<boolean>('/api/aiMusic/audio/delete', {
    method: 'POST',
    body: JSON.stringify({ id }),
  })
}

export const loadAiMusicWorkflowGraph = async (workflowId: string) => {
  const workflow = await getWorkflow(workflowId)
  if (!workflow.graphJson) {
    throw new Error('工作流暂无画布数据')
  }

  const graph = JSON.parse(workflow.graphJson) as unknown
  if (!isWorkflowGraph(graph)) {
    throw new Error('工作流画布数据格式异常')
  }

  return { workflow, graph }
}

export const runAiMusicWorkflow = async (params: {
  workflowId: string
  inputValue: string
  graph: WorkflowGraph
}) => {
  const startNodeId = findStartNodeId(params.graph)
  if (!startNodeId) {
    throw new Error('未找到入口节点（ObjectInput/ChatInput），无法触发工作流')
  }

  return runFlow({
    flowId: params.workflowId,
    inputValue: params.inputValue,
    startNodeId,
    sessionId: `ai-music-${Date.now()}`,
    flow: {
      nodes: params.graph.nodes,
      edges: params.graph.edges,
      viewport: params.graph.viewport,
    },
  })
}

export type { WorkflowGraph }
