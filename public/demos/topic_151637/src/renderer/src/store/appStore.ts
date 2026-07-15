import { create } from 'zustand'
import type {
  DatasetSummary,
  DatasetContext,
  AgentStep,
  ChartSpec,
  Report,
  ProgressEvent,
  DashboardSummary,
  AnalysisResult,
  ResearchFinding
} from '../../../types/shared'

/** 安全访问 preload 注入的 API；非 Electron 环境返回 undefined */
function api() {
  return typeof window !== 'undefined' ? window.datapilot : undefined
}

// === 会话类型 ===
export interface Session {
  id: string
  title: string
  goal: string
  steps: AgentStep[]
  charts: ChartSpec[]
  report: Report | null
  /** 看板 HTML（自包含文件，由 Agent 的 generate_dashboard 工具生成） */
  dashboardHTML?: string | null
  // 多轮对话累积结果（关键：让 LLM 知道已经做过的分析，避免重复）
  analysisResults: AnalysisResult[]
  researchFindings: ResearchFinding[]
  datasetId?: string
  datasetName?: string
  // 多轮对话历史
  conversation: { role: 'user' | 'assistant'; content: string }[]
  createdAt: string
  updatedAt: string
}

// === API 配置类型 ===
export interface ApiConfig {
  id: string
  name: string       // 显示名称（如 GLM-5.2）
  model: string      // 模型标识（如 ZhipuAI/GLM-5.2）
  apiKey: string
  baseUrl: string
}

// === 设置类型 ===
export interface AppSettings {
  // API 配置列表
  apiConfigs: ApiConfig[]
  activeApiConfigId: string | null
  // 页面风格
  theme: 'dark' | 'light'
  accentColor: string
  fontSize: 'small' | 'medium' | 'large'
  // Agent Skills
  skills: {
    deepResearch: boolean
    analysis: boolean
    plot: boolean
    report: boolean
    prediction: boolean
    backtest: boolean
  }
  /** 图表风格 ID */
  activeStyleId: string
  /** 用户自定义风格列表 */
  customStyles: Array<{ id: string; name: string; prompt: string }>
  pythonPath: string
  sandboxTimeout: string
}

const DEFAULT_SETTINGS: AppSettings = {
  apiConfigs: [],
  activeApiConfigId: null,
  theme: 'dark',
  accentColor: '#f97316',
  fontSize: 'medium',
  skills: {
    deepResearch: true,
    analysis: true,
    plot: true,
    report: true,
    prediction: false,
    backtest: false
  },
  pythonPath: 'python',
  sandboxTimeout: '30000',
  activeStyleId: 'clean-white',
  customStyles: []
}

/** 从旧版单 API 配置迁移到列表 */
function migrateOldSettings(parsed: Record<string, unknown>): Partial<AppSettings> {
  // 如果已有 apiConfigs 数组，直接用
  if (Array.isArray(parsed.apiConfigs)) {
    return parsed as unknown as Partial<AppSettings>
  }
  // 旧版字段迁移
  const oldKey = parsed.apiKey as string
  const oldUrl = (parsed.baseUrl as string) || 'https://api-inference.modelscope.cn/v1'
  const oldModel = (parsed.model as string) || 'ZhipuAI/GLM-5.2'
  if (oldKey) {
    const id = `api-${Date.now()}`
    return {
      apiConfigs: [{ id, name: oldModel.split('/').pop() || oldModel, model: oldModel, apiKey: oldKey, baseUrl: oldUrl }],
      activeApiConfigId: id
    }
  }
  return { apiConfigs: [], activeApiConfigId: null }
}

// === localStorage 辅助 ===
function loadSessions(): Session[] {
  try {
    const raw = localStorage.getItem('datapilot-sessions')
    if (!raw) return []
    const parsed = JSON.parse(raw) as Session[]
    // 兼容旧 session：补全新增字段
    return parsed.map((s) => ({
      ...s,
      steps: s.steps || [],
      charts: s.charts || [],
      report: s.report || null,
      conversation: s.conversation || [],
      analysisResults: s.analysisResults || [],
      researchFindings: s.researchFindings || [],
      datasetName: s.datasetName || '',
      title: s.title || s.goal || '未命名会话'
    }))
  } catch {
    return []
  }
}

function saveSessions(sessions: Session[]) {
  try {
    localStorage.setItem('datapilot-sessions', JSON.stringify(sessions))
  } catch {
    // 存储满或隐私模式
  }
}

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem('datapilot-settings')
    if (raw) {
      const parsed = JSON.parse(raw)
      const migrated = migrateOldSettings(parsed)
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        ...migrated,
        skills: { ...DEFAULT_SETTINGS.skills, ...(parsed.skills || {}) }
      }
    }
  } catch {
    // ignore
  }
  return DEFAULT_SETTINGS
}

function saveSettings(settings: AppSettings) {
  try {
    localStorage.setItem('datapilot-settings', JSON.stringify(settings))
  } catch {
    // ignore
  }
}

function genId() {
  return `s-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

interface AppState {
  // 数据源
  datasets: DatasetSummary[]
  selectedDataset: DatasetContext | null
  /** 缓存已加载的 DatasetContext（上传数据集 re-select 时复用） */
  datasetCache: Record<string, DatasetContext>
  showUploadModal: boolean

  // 会话
  sessions: Session[]
  currentSessionId: string | null

  // Agent 状态（全局显示层 — 镜像当前会话数据）
  goal: string
  agentRunning: boolean
  runningSessionId: string | null  // 正在运行的会话 ID（用于隔离）
  agentSteps: AgentStep[]
  charts: ChartSpec[]
  report: Report | null
  /** 看板 HTML（自包含文件，由 Agent 的 generate_dashboard 工具生成） */
  dashboardHTML: string | null
  /** API 服务端口（主进程内嵌 Express，供看板 iframe 查询 SQL） */
  apiPort: number | null
  agentError: string | null
  /** 运行时排队消息：Agent 运行中用户输入的消息会暂存于此，等待运行完成后自动执行 */
  pendingGoal: string | null

  // 看板
  dashboards: DashboardSummary[]

  // Token 用量追踪
  tokenUsage: { estimated: number; max: number } | null

  // 设置
  settings: AppSettings

  // 视图导航
  view: 'chat' | 'dashboards' | 'settings'
  setView: (v: 'chat' | 'dashboards' | 'settings') => void

  // Actions — 数据源
  loadSamples: () => Promise<void>
  selectDataset: (id: string) => Promise<void>
  clearDataset: () => void
  deleteDataset: (id: string) => void
  setShowUploadModal: (show: boolean) => void
  uploadFile: () => Promise<void>
  uploadText: (text: string, name: string) => Promise<void>

  // Actions — 会话
  createSession: () => string
  switchSession: (id: string) => void
  deleteSession: (id: string) => void
  renameSession: (id: string, title: string) => void

  // Actions — Agent
  runAgent: (goal: string) => Promise<void>
  cancelAgent: () => Promise<void>
  /** 运行时排队：Agent 运行中将消息暂存，运行完成后自动发送 */
  enqueueGoal: (goal: string) => void

  // Actions — 看板
  loadDashboards: () => Promise<void>
  deleteDashboard: (id: string) => Promise<void>
  saveDashboard: () => Promise<void>
  /** 设置 API 端口（由主进程发送） */
  setApiPort: (port: number) => void
  /** 设置看板 HTML（用于测试或直接加载） */
  setDashboardHTML: (html: string | null) => void

  // Actions — 设置
  updateSettings: (partial: Partial<AppSettings>) => void
  addApiConfig: (config: Omit<ApiConfig, 'id'>) => string
  updateApiConfig: (id: string, config: Partial<Omit<ApiConfig, 'id'>>) => void
  deleteApiConfig: (id: string) => void
  setActiveApiConfig: (id: string) => void
  setActiveStyle: (styleId: string) => void
  addCustomStyle: (name: string, prompt: string) => void
  deleteCustomStyle: (id: string) => void
  updateCustomStyle: (id: string, name: string, prompt: string) => void

  // Actions — 事件处理
  handleProgress: (event: ProgressEvent) => void
  handleComplete: (result: {
    steps: AgentStep[]
    charts: ChartSpec[]
    report?: Report
    dashboardHTML?: string | null
    errors: string[]
    analysisResults?: AnalysisResult[]
    researchFindings?: ResearchFinding[]
  }) => void
  handleError: (error: { message: string }) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  datasets: [],
  datasetCache: {},
  selectedDataset: null,
  showUploadModal: false,

  sessions: loadSessions(),
  currentSessionId: null,

  goal: '',
  agentRunning: false,
  runningSessionId: null,
  agentSteps: [],
  charts: [],
  report: null,
  dashboardHTML: null,
  apiPort: null,
  agentError: null,
  pendingGoal: null,

  dashboards: [],
  tokenUsage: null,

  settings: loadSettings(),

  view: 'chat',
  setView: (v) => set({ view: v }),

  loadSamples: async () => {
    try {
      const samples = await api()?.data.listSamples()
      if (samples) set({ datasets: samples })
    } catch (e) {
      console.error('Failed to load samples:', e)
    }
  },

  selectDataset: async (id: string) => {
    try {
      // 优先从缓存获取（上传数据集 re-select 时复用）
      const cached = get().datasetCache[id]
      if (cached) {
        set({ selectedDataset: cached })
        return
      }
      const dataset = await api()?.data.loadSample(id)
      if (dataset) set({ selectedDataset: dataset })
    } catch (e) {
      console.error('Failed to load dataset:', e)
    }
  },

  deleteDataset: (id: string) => {
    set((state) => {
      const newDatasets = state.datasets.filter((d) => d.id !== id)
      const newCache = { ...state.datasetCache }
      delete newCache[id]
      const newSelected = state.selectedDataset?.id === id ? null : state.selectedDataset
      return { datasets: newDatasets, datasetCache: newCache, selectedDataset: newSelected }
    })
  },

  clearDataset: () => {
    set({ selectedDataset: null })
  },

  setShowUploadModal: (show: boolean) => set({ showUploadModal: show }),

  uploadFile: async () => {
    try {
      const filePath = await api()?.dialog.openFile()
      if (!filePath) return
      const dataset = await api()?.data.uploadFile(filePath)
      if (dataset) {
        const name = dataset.name
        set((state) => ({
          selectedDataset: dataset,
          datasetCache: { ...state.datasetCache, [dataset.id]: dataset },
          datasets: state.datasets.some((d) => d.id === dataset.id)
            ? state.datasets
            : [...state.datasets, { id: dataset.id, name, description: `上传文件: ${name}`, source: 'upload' as const, rowCount: dataset.schema.shape[0], columns: dataset.schema.columns }]
        }))
      }
    } catch (e) {
      console.error('Failed to upload file:', e)
      set({ agentError: `上传失败: ${String(e)}` })
    }
  },

  uploadText: async (text: string, name: string) => {
    try {
      // 将文本保存为临时 CSV 并加载
      const dataset = await api()?.data.uploadText(text, name)
      if (dataset) {
        set((state) => ({
          selectedDataset: dataset,
          datasetCache: { ...state.datasetCache, [dataset.id]: dataset },
          datasets: state.datasets.some((d) => d.id === dataset.id)
            ? state.datasets
            : [...state.datasets, { id: dataset.id, name, description: `文本数据: ${name}`, source: 'upload' as const, rowCount: dataset.schema.shape[0], columns: dataset.schema.columns }]
        }))
      }
    } catch (e) {
      console.error('Failed to upload text:', e)
      set({ agentError: `文本加载失败: ${String(e)}` })
    }
  },

  createSession: () => {
    const id = genId()
    const now = new Date().toISOString()
    const session: Session = {
      id,
      title: '新对话',
      goal: '',
      steps: [],
      charts: [],
      report: null,
      dashboardHTML: null,
      analysisResults: [],
      researchFindings: [],
      conversation: [],
      createdAt: now,
      updatedAt: now
    }
    set((state) => {
      const sessions = [session, ...state.sessions]
      saveSessions(sessions)
      return {
        sessions,
        currentSessionId: id,
        goal: '',
        agentSteps: [],
        charts: [],
        report: null,
        agentError: null
      }
    })
    return id
  },

  switchSession: (id: string) => {
    const session = get().sessions.find((s) => s.id === id)
    if (!session) return
    // 切换到目标会话：加载该会话的数据到全局显示层
    // 不影响正在运行的会话（runningSessionId 不变）
    set({
      currentSessionId: id,
      goal: session.goal || '',
      agentSteps: session.steps || [],
      charts: session.charts || [],
        report: session.report || null,
        dashboardHTML: null,
        agentError: null,
      view: 'chat',  // 自动跳转到对话界面
    })
  },

  deleteSession: (id: string) => {
    try {
      // 如果删除的是正在运行的会话，先取消
      const state = get()
      if (state.runningSessionId === id && state.agentRunning) {
        api()?.agent.cancel().catch(() => {})
      }

      // 释放该 session 对应的 sandbox（Python 子进程）
      try {
        api()?.agent.stopSession(id)?.catch(() => {})
      } catch {
        // api() 可能尚未初始化，静默忽略
      }
    } catch {
      // 兜底：任何 pre-set 的错误都不应阻塞删除
    }

    set((state) => {
      const sessions = state.sessions.filter((s) => s.id !== id)
      saveSessions(sessions)
      const wasCurrent = state.currentSessionId === id
      const wasRunning = state.runningSessionId === id
      return {
        sessions,
        currentSessionId: wasCurrent ? null : state.currentSessionId,
        ...(wasCurrent ? { goal: '', agentSteps: [], charts: [], report: null } : {}),
        ...(wasRunning ? { agentRunning: false, runningSessionId: null } : {})
      }
    })
  },

  renameSession: (id: string, title: string) => {
    set((state) => {
      const sessions = state.sessions.map((s) =>
        s.id === id ? { ...s, title, updatedAt: new Date().toISOString() } : s
      )
      saveSessions(sessions)
      return { sessions }
    })
  },

  runAgent: async (goal: string) => {
    const state = get()
    // 确保有会话
    let sessionId = state.currentSessionId
    if (!sessionId) {
      sessionId = state.createSession()
    }

    // 如果另一个会话正在运行，不允许启动新运行
    if (state.agentRunning && state.runningSessionId !== sessionId) {
      set({ agentError: '另一个会话正在运行中，请等待完成或停止后再发送' })
      return
    }

    // 多轮对话：保留已有步骤/图表/报告，记录用户消息为 timeline 步骤
    // Timeline 上的"启动中/处理中"占位由 AgentTimeline 自动渲染（不需注入 startup 步骤）
    const userStep: AgentStep = {
      agent: 'user',
      action: 'message',
      reasoning: goal,
      timestamp: new Date().toISOString(),
      durationMs: 0
    }
    set((s) => ({
      goal,
      agentRunning: true,
      runningSessionId: sessionId,
      agentSteps: [...s.agentSteps, userStep],
      agentError: null,
      tokenUsage: null,
      dashboardHTML: null
      // 不清空 charts/report — 多轮对话中保留之前的结果
    }))

    // 更新会话标题（仅首次或标题为"新对话"时）
    const currentSession = get().sessions.find((s) => s.id === sessionId)
    if (currentSession && (currentSession.title === '新对话' || !currentSession.title)) {
      get().renameSession(sessionId!, goal.slice(0, 30))
    }

    const datasetId = get().selectedDataset?.id
    const datasetPath = get().selectedDataset?.samplePath
    const { settings } = get()

    // 获取当前激活的 API 配置
    const activeConfig = settings.apiConfigs.find((c) => c.id === settings.activeApiConfigId)

    // 检查 API 配置
    if (!activeConfig || !activeConfig.apiKey) {
      set({
        agentRunning: false,
        runningSessionId: null,
        agentError: '未配置 API。请到「设置 → API 配置」中添加 API 配置后再运行。',
        agentSteps: [...get().agentSteps, {
          agent: 'orchestrator',
          action: 'config_error',
          reasoning: 'API 未配置',
          timestamp: new Date().toISOString(),
          durationMs: 0,
          error: '请在设置页面配置 API'
        }]
      })
      return
    }

    try {
      // 构建多轮对话历史
      const session = get().sessions.find((s) => s.id === sessionId)
      const conversationHistory = session?.conversation || []

      // 关键修复：把当前会话已有的累积结果作为 priorState 传给主进程
      // 让 LLM 知道之前已经做了什么，避免重做
      // 同时 sessionId 复用，保证 sandbox 中的 df 变量持续存在
      const priorState = session
        ? {
            sessionId: session.id,
            datasetId: session.datasetId || datasetId,
            analysisResults: session.analysisResults || [],
            chartSpecs: session.charts || [],
            researchFindings: session.researchFindings || [],
            report: session.report || null
          }
        : undefined

      await api()?.agent.run(
        goal,
        datasetId,
        {
          apiKey: activeConfig.apiKey,
          baseURL: activeConfig.baseUrl || undefined,
          model: activeConfig.model || undefined
        },
        conversationHistory,
        priorState,
        datasetPath,
        settings.activeStyleId,
        settings.customStyles.find((s) => s.id === settings.activeStyleId)?.prompt,
        get().apiPort ?? undefined
      )
    } catch (e) {
      console.error('Failed to run agent:', e)
      const errMsg = e instanceof Error ? e.message : String(e)
      set({
        agentRunning: false,
        runningSessionId: null,
        agentError: errMsg,
        agentSteps: [...get().agentSteps, {
          agent: 'orchestrator',
          action: 'fatal_error',
          reasoning: 'Agent 启动失败',
          timestamp: new Date().toISOString(),
          durationMs: 0,
          error: errMsg
        }]
      })
    }
  },

  cancelAgent: async () => {
    try {
      await api()?.agent.cancel()
    } catch (e) {
      console.error('Failed to cancel agent:', e)
    }
    set({ agentRunning: false, runningSessionId: null, tokenUsage: null, pendingGoal: null })
  },

  enqueueGoal: (goal: string) => {
    set({ pendingGoal: goal })
  },

  loadDashboards: async () => {
    try {
      const dashboards = await api()?.storage.listDashboards()
      if (dashboards) set({ dashboards })
    } catch (e) {
      console.error('Failed to load dashboards:', e)
    }
  },

  saveDashboard: async () => {
    const state = get()
    if (!state.report && state.charts.length === 0) return
    try {
      await api()?.storage.saveDashboard({
        goal: state.goal || '未命名分析',
        report: state.report ? JSON.stringify(state.report) : '',
        charts: state.charts,
        steps: state.agentSteps,
        dashboardHTML: state.dashboardHTML || null,
      })
      const dashboards = await api()?.storage.listDashboards()
      if (dashboards) set({ dashboards })
      // 保存后自动跳转到看板视图
      set({ view: 'dashboards' })
    } catch (e) {
      console.error('Failed to save dashboard:', e)
    }
  },

  deleteDashboard: async (id: string) => {
    try {
      await api()?.storage.deleteDashboard(id)
      set((state) => ({
        dashboards: state.dashboards.filter((d) => d.id !== id)
      }))
    } catch (e) {
      console.error('Failed to delete dashboard:', e)
    }
  },

  setApiPort: (port: number) => {
    set({ apiPort: port })
  },

  setDashboardHTML: (html: string | null) => {
    set({ dashboardHTML: html })
  },

  updateSettings: (partial: Partial<AppSettings>) => {
    set((state) => {
      const settings = { ...state.settings, ...partial, skills: { ...state.settings.skills, ...(partial.skills || {}) } }
      saveSettings(settings)
      return { settings }
    })
  },

  addApiConfig: (config: Omit<ApiConfig, 'id'>) => {
    const id = `api-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    set((state) => {
      const newConfig: ApiConfig = { ...config, id }
      const settings = {
        ...state.settings,
        apiConfigs: [...state.settings.apiConfigs, newConfig],
        activeApiConfigId: state.settings.activeApiConfigId || id
      }
      saveSettings(settings)
      return { settings }
    })
    return id
  },

  updateApiConfig: (id: string, config: Partial<Omit<ApiConfig, 'id'>>) => {
    set((state) => {
      const settings = {
        ...state.settings,
        apiConfigs: state.settings.apiConfigs.map((c) =>
          c.id === id ? { ...c, ...config } : c
        )
      }
      saveSettings(settings)
      return { settings }
    })
  },

  deleteApiConfig: (id: string) => {
    set((state) => {
      const apiConfigs = state.settings.apiConfigs.filter((c) => c.id !== id)
      const activeApiConfigId =
        state.settings.activeApiConfigId === id
          ? (apiConfigs[0]?.id ?? null)
          : state.settings.activeApiConfigId
      const settings = { ...state.settings, apiConfigs, activeApiConfigId }
      saveSettings(settings)
      return { settings }
    })
  },

  setActiveApiConfig: (id: string) => {
    set((state) => {
      const settings = { ...state.settings, activeApiConfigId: id }
      saveSettings(settings)
      return { settings }
    })
  },

  setActiveStyle: (styleId: string) => {
    set((state) => {
      const settings = { ...state.settings, activeStyleId: styleId }
      saveSettings(settings)
      return { settings }
    })
  },

  addCustomStyle: (name: string, prompt: string) => {
    set((state) => {
      const id = `custom-${Date.now()}`
      const customStyles = [...state.settings.customStyles, { id, name, prompt }]
      const settings = { ...state.settings, customStyles }
      saveSettings(settings)
      return { settings }
    })
  },

  deleteCustomStyle: (id: string) => {
    set((state) => {
      const customStyles = state.settings.customStyles.filter((s) => s.id !== id)
      const settings = { ...state.settings, customStyles }
      saveSettings(settings)
      return { settings }
    })
  },

  updateCustomStyle: (id: string, name: string, prompt: string) => {
    set((state) => {
      const customStyles = state.settings.customStyles.map((s) =>
        s.id === id ? { ...s, name, prompt } : s
      )
      const settings = { ...state.settings, customStyles }
      saveSettings(settings)
      return { settings }
    })
  },

  handleProgress: (event: ProgressEvent) => {
    const { runningSessionId, currentSessionId } = get()
    if (!runningSessionId) return

    // 当前是否在查看运行中的会话
    const isViewingRunning = currentSessionId === runningSessionId

    // 根据事件类型构建新的 step / chart
    let newStep: AgentStep | null = null
    let newChart: ChartSpec | null = null
    let newReport: Report | null = null
    let newError: string | null = null

    // CodingAgent tool_call: 展示工具调用动作
    if (event.type === 'agent_step' && event.data) {
      if (event.agent === 'coding') {
        const data = event.data as {
          type?: string
          name?: string
          arguments?: Record<string, unknown>
          thinking?: string
          toolCalls?: string[]
        }

        if (data.type === 'thinking') {
          // 流式思考过程：更新/替换最后一个 thinking 步骤
          newStep = {
            agent: 'coding',
            action: 'thinking',
            reasoning: data.thinking || event.message,
            timestamp: event.timestamp,
            durationMs: 0,
          }
        } else if (data.type === 'thinking_complete') {
          // 思考完成：标记最后一个 thinking 步骤为完成（UI 折叠）
          newStep = {
            agent: 'coding',
            action: 'thinking_complete',
            reasoning: data.thinking || '',
            timestamp: event.timestamp,
            durationMs: 0,
          }
        } else if (data.type === 'replace_thinking') {
          // 流式文本实际是最终答案：移除 thinking 步骤，替换为最终答案
          newStep = {
            agent: 'coding',
            action: 'final_answer',
            reasoning: event.message || '',
            timestamp: event.timestamp,
            durationMs: 0,
          }
        } else {
          // 普通工具调用
          const tc = event.data as { name?: string; arguments?: Record<string, unknown> }
          const actionName = tc.name || 'execute'
          const desc = (tc.arguments as Record<string, string>)?.description || ''
          newStep = {
            agent: 'coding',
            action: actionName,
            reasoning: desc || event.message,
            timestamp: event.timestamp,
            durationMs: 0,
          }
        }
      } else {
        // Deep research 等旧格式
        const f = event.data as ResearchFinding
        newStep = {
          agent: event.agent || 'deep_research',
          action: 'data_fetch',
          reasoning: f.query,
          timestamp: event.timestamp,
          durationMs: 0,
          result: f.summary
        }
      }
    }

    // CodingAgent sandbox_execute 结果 → 代码执行步骤
    if (event.type === 'code_generated' && event.data) {
      const r = event.data as { name?: string; output?: string; data?: { result?: unknown; durationMs?: number } }
      const resultData = r.data
      newStep = {
        agent: 'coding',
        action: 'execute_code',
        reasoning: r.output ? r.output.slice(0, 200) : '代码执行完成',
        timestamp: event.timestamp,
        durationMs: resultData?.durationMs || 0,
        result: resultData?.result,
      }
    }

    // CodingAgent generate_chart 结果
    if (event.type === 'chart_ready' && event.data) {
      const chartData = event.data as { data?: { title?: string; figure?: object; reasoning?: string } }
      if (chartData.data?.title && chartData.data?.figure) {
        const chart: ChartSpec = {
          title: chartData.data.title,
          figure: chartData.data.figure,
          reasoning: chartData.data.reasoning || '',
          source: 'agent',
        }
        newChart = chart
        newStep = {
          agent: 'coding',
          action: 'generate_chart',
          reasoning: chartData.data.title,
          timestamp: event.timestamp,
          durationMs: 0,
        }
      }
    }

    // dashboard_ready: 看板已生成
    if (event.type === 'dashboard_ready' && event.data) {
      const d = event.data as { dashboardHTML?: string }
      if (d.dashboardHTML) {
        // 同时更新全局状态和会话状态
        const sessions = get().sessions.map((sess) => {
          if (sess.id !== runningSessionId) return sess
          return { ...sess, dashboardHTML: d.dashboardHTML!, updatedAt: new Date().toISOString() }
        })
        set({ dashboardHTML: d.dashboardHTML, sessions })
        saveSessions(sessions)
      }
      return
    }

    // CodingAgent generate_report 结果
    if (event.type === 'report_section' && event.data) {
      const reportData = event.data as { data?: { title?: string; content?: string } }
      if (reportData.data?.title && reportData.data?.content) {
        newReport = {
          title: reportData.data.title,
          sections: [{ heading: '报告', content: reportData.data.content }],
          generatedAt: event.timestamp,
        }
      }
    }

    // agent_start: 心跳更新（不创建步骤）
    if (event.type === 'agent_start') {
      // 仅更新 running 状态，不创建步骤
    }

    // token_usage: 更新上下文窗口用量
    if (event.type === 'token_usage' && event.data) {
      const tu = event.data as { estimated?: number; max?: number }
      if (tu.estimated && tu.max) {
        set({ tokenUsage: { estimated: tu.estimated, max: tu.max } })
      }
      return
    }

    if (event.type === 'error') {
      newError = event.message
      // 将错误绑定到最后一个步骤上，而不是用全局 agentError
      // 这样错误就会固定在原步骤位置，不会跟随最新消息
    }

    // 1. 始终更新运行中会话的数据（写入 sessions 数组）
    set((state) => {
      const sessions = state.sessions.map((sess) => {
        if (sess.id !== runningSessionId) return sess

        let updatedSteps = sess.steps
        if (newStep) {
          if (newStep.action === 'thinking') {
            // 流式思考：替换最后一个 thinking 步骤（流式更新）
            const lastIdx = updatedSteps.length - 1
            if (lastIdx >= 0 && updatedSteps[lastIdx].action === 'thinking') {
              const copy = [...updatedSteps]
              copy[lastIdx] = newStep
              updatedSteps = copy
            } else {
              updatedSteps = [...updatedSteps, newStep]
            }
          } else if (newStep.action === 'thinking_complete') {
            // 思考完成：替换最后一个 thinking 步骤为完成态
            const lastIdx = updatedSteps.length - 1
            if (lastIdx >= 0 && updatedSteps[lastIdx].action === 'thinking') {
              const copy = [...updatedSteps]
              // 保留思考内容，但标记为已完成
              copy[lastIdx] = { ...copy[lastIdx], action: 'thinking_complete', reasoning: newStep.reasoning }
              updatedSteps = copy
            }
          } else if (newStep.action === 'final_answer') {
            // 替换 thinking：移除最后一个 thinking 步骤，替换为最终答案
            const lastIdx = updatedSteps.length - 1
            if (lastIdx >= 0 && (updatedSteps[lastIdx].action === 'thinking' || updatedSteps[lastIdx].action === 'thinking_complete')) {
              const copy = [...updatedSteps]
              copy[lastIdx] = newStep
              updatedSteps = copy
            } else {
              updatedSteps = [...updatedSteps, newStep]
            }
          } else {
            updatedSteps = [...updatedSteps, newStep]
          }
        }

        return {
          ...sess,
          steps: updatedSteps,
          charts: newChart ? [...sess.charts, newChart!] : sess.charts,
          report: newReport ?? sess.report,
          goal: state.goal,
          updatedAt: new Date().toISOString()
        }
      })
      saveSessions(sessions)

      // 2. 仅当查看运行中会话时，更新全局显示层
      if (isViewingRunning) {
        let updatedAgentSteps = state.agentSteps
        if (newStep) {
          if (newStep.action === 'thinking') {
            const lastIdx = updatedAgentSteps.length - 1
            if (lastIdx >= 0 && updatedAgentSteps[lastIdx].action === 'thinking') {
              const copy = [...updatedAgentSteps]
              copy[lastIdx] = newStep
              updatedAgentSteps = copy
            } else {
              updatedAgentSteps = [...updatedAgentSteps, newStep]
            }
          } else if (newStep.action === 'thinking_complete') {
            const lastIdx = updatedAgentSteps.length - 1
            if (lastIdx >= 0 && updatedAgentSteps[lastIdx].action === 'thinking') {
              const copy = [...updatedAgentSteps]
              copy[lastIdx] = { ...copy[lastIdx], action: 'thinking_complete', reasoning: newStep.reasoning }
              updatedAgentSteps = copy
            }
          } else if (newStep.action === 'final_answer') {
            const lastIdx = updatedAgentSteps.length - 1
            if (lastIdx >= 0 && (updatedAgentSteps[lastIdx].action === 'thinking' || updatedAgentSteps[lastIdx].action === 'thinking_complete')) {
              const copy = [...updatedAgentSteps]
              copy[lastIdx] = newStep
              updatedAgentSteps = copy
            } else {
              updatedAgentSteps = [...updatedAgentSteps, newStep]
            }
          } else {
            updatedAgentSteps = [...updatedAgentSteps, newStep]
          }
        }
        // 如果发生了错误且没有新步骤，将错误附加到最后一个步骤上
        if (newError && !newStep && updatedAgentSteps.length > 0) {
          const lastIdx = updatedAgentSteps.length - 1
          const copy = [...updatedAgentSteps]
          copy[lastIdx] = { ...copy[lastIdx], error: newError }
          updatedAgentSteps = copy
        }
        return {
          sessions,
          agentSteps: updatedAgentSteps,
          charts: newChart ? [...state.charts, newChart!] : state.charts,
          report: newReport ?? state.report,
          agentError: null  // 不再使用全局 agentError，错误绑定到步骤上
        }
      }
      return { sessions }
    })
  },

  handleComplete: (result) => {
    const { runningSessionId, currentSessionId } = get()
    if (!runningSessionId) return

    const isViewingRunning = currentSessionId === runningSessionId

    // 构建 assistant 摘要
    const assistantSummary = result.report
      ? result.report.sections.map((sec) => `${sec.heading}: ${sec.content}`).join(' ').slice(0, 800)
      : `完成了 ${result.steps?.length || 0} 个步骤，生成了 ${result.charts?.length || 0} 个图表`

    // 更新运行中会话：追加对话历史，合并图表/报告/分析结果（不覆盖已有步骤）
    set((state) => {
      const sessions = state.sessions.map((sess) => {
        if (sess.id !== runningSessionId) return sess

        // 合并图表：保留已有 + 补充 result 中可能遗漏的（按标题去重）
        const existingChartTitles = new Set(sess.charts.map((c) => c.title))
        const mergedCharts = [
          ...sess.charts,
          ...(result.charts || []).filter((c) => !existingChartTitles.has(c.title))
        ]

        // 合并分析结果：按 title 去重，保留已有 + 补充新生成的
        const existingAnalysisTitles = new Set((sess.analysisResults || []).map((a) => a.title))
        const mergedAnalysis = [
          ...(sess.analysisResults || []),
          ...(result.analysisResults || []).filter((a) => !existingAnalysisTitles.has(a.title))
        ]

        // 合并 research findings
        const mergedFindings = [
          ...(sess.researchFindings || []),
          ...(result.researchFindings || [])
        ]

        return {
          ...sess,
          // steps 已通过 handleProgress 实时追加，这里不再覆盖
          charts: mergedCharts,
          analysisResults: mergedAnalysis,
          researchFindings: mergedFindings,
          report: result.report || sess.report,
          dashboardHTML: result.dashboardHTML || sess.dashboardHTML,
          goal: state.goal,
          conversation: [
            ...(sess.conversation || []),
            { role: 'user' as const, content: state.goal },
            { role: 'assistant' as const, content: assistantSummary }
          ],
          updatedAt: new Date().toISOString()
        }
      })
      saveSessions(sessions)

      const updates: Record<string, unknown> = {
        sessions,
        agentRunning: false,
        runningSessionId: null,
        tokenUsage: null,
        agentError: result.errors?.length ? result.errors.join('\n') : null
      }

      // 仅当查看运行中会话时，更新全局显示层
      if (isViewingRunning) {
        // 合并图表到显示层
        const existingChartTitles = new Set(state.charts.map((c) => c.title))
        const mergedCharts = [
          ...state.charts,
          ...(result.charts || []).filter((c) => !existingChartTitles.has(c.title))
        ]
        updates.charts = mergedCharts
        updates.report = result.report || state.report
        updates.dashboardHTML = result.dashboardHTML || state.dashboardHTML
      }

      return updates
    })

    // 自动出队：如果运行完成后有排队消息，自动执行
    const pending = get().pendingGoal
    if (pending) {
      set({ pendingGoal: null })
      // 延迟一帧确保 UI 更新后再发送
      setTimeout(() => get().runAgent(pending), 100)
    }
  },

  handleError: (error) => {
    const { runningSessionId, currentSessionId } = get()
    const isViewingRunning = currentSessionId === runningSessionId

    set((state) => {
      const updates: Record<string, unknown> = {
        agentRunning: false,
        runningSessionId: null
      }

      if (isViewingRunning) {
        updates.agentError = error.message
      }

      // 在运行中会话追加错误步骤
      if (runningSessionId) {
        const sessions = state.sessions.map((sess) => {
          if (sess.id !== runningSessionId) return sess
          return {
            ...sess,
            updatedAt: new Date().toISOString()
          }
        })
        saveSessions(sessions)
        updates.sessions = sessions
      }

      return updates
    })
  }
}))
