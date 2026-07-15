/**
 * IPC 通道名常量与载荷类型 — 供 main/preload/renderer 共用。
 */

export const IPC = {
  AGENT_RUN: 'agent:run',
  AGENT_CANCEL: 'agent:cancel',
  AGENT_PROGRESS: 'agent:progress',
  AGENT_COMPLETE: 'agent:complete',
  AGENT_ERROR: 'agent:error',
  /** 主动停止指定 session 的 sandbox（删除会话/退出时用） */
  SANDBOX_STOP: 'sandbox:stop',
  DATA_LIST_SAMPLES: 'data:listSamples',
  DATA_LOAD_SAMPLE: 'data:loadSample',
  DATA_UPLOAD: 'data:upload',
  DATA_UPLOAD_TEXT: 'data:uploadText',
  DATA_PREVIEW: 'data:preview',
  DIALOG_OPEN_FILE: 'dialog:openFile',
  STORAGE_LIST: 'storage:list',
  STORAGE_GET: 'storage:get',
  STORAGE_SAVE: 'storage:save',
  STORAGE_DELETE: 'storage:delete'
} as const

/** 样例数据 schema（对应 resources/samples/*.schema.json） */
export interface SampleSchema {
  name: string
  description: string
  columns: Record<
    string,
    {
      label: string
      type: string
      role: string
    }
  >
  suggested_charts: string[]
}

/** 前一轮 Agent 执行的结果快照（用于多轮对话上下文复用） */
export interface PriorAgentState {
  /** 复用前一会话的 ID，保持 sandbox 中的 df 变量持续存在 */
  sessionId: string
  datasetId?: string
  datasetPath?: string
  analysisResults: Array<{
    title: string
    code: string
    stdout: string
    stderr: string
    result: unknown
    durationMs: number
    retries: number
  }>
  chartSpecs: Array<{
    title: string
    figure: object
    reasoning: string
    source: string
  }>
  researchFindings: Array<{
    source: string
    query: string
    summary: string
    timestamp: string
  }>
  report?: {
    title: string
    sections: Array<{ heading: string; content: string }>
    generatedAt: string
  } | null
}

/** agent:run 请求参数 */
export interface AgentRunParams {
  goal: string
  datasetId?: string
  /** 上传数据集的实际文件路径（非 samples 目录） */
  datasetPath?: string
  /** 图表风格 ID */
  styleId?: string
  /** 自定义风格 prompt */
  customStylePrompt?: string
  /** API 端口（主进程内嵌 Express 服务，供看板 iframe 查询 SQL） */
  apiPort?: number
  llmConfig?: {
    apiKey?: string
    baseURL?: string
    model?: string
  }
  conversationHistory?: { role: 'user' | 'assistant'; content: string }[]
  /** 多轮对话中前一轮的状态（让 LLM 知道已经做过的分析/图表/报告） */
  priorState?: PriorAgentState
}

/** agent:run 返回值 */
export interface AgentRunResult {
  sessionId: string
  goal: string
  steps: unknown[]
  charts: unknown[]
  analysisResults: unknown[]
  researchFindings: unknown[]
  report?: unknown
  errors: string[]
  iteration: number
}
