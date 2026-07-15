import type {
  DatasetSummary,
  DatasetContext,
  Dashboard,
  DashboardSummary,
  ProgressEvent,
  AgentStep,
  ChartSpec,
  Report
} from '../types/shared'

export interface AgentRunResult {
  sessionId: string
  goal: string
  steps: AgentStep[]
  charts: ChartSpec[]
  analysisResults: unknown[]
  researchFindings: unknown[]
  report?: Report
  errors: string[]
  iteration: number
}

export interface DataPilotAPI {
  agent: {
    run: (
      goal: string,
      datasetId?: string,
      llmConfig?: { apiKey?: string; baseURL?: string; model?: string },
      conversationHistory?: { role: 'user' | 'assistant'; content: string }[],
      priorState?: PriorAgentState,
      datasetPath?: string,
      styleId?: string,
      customStylePrompt?: string,
      apiPort?: number
    ) => Promise<AgentRunResult>
    cancel: () => Promise<void>
    onProgress: (callback: (event: ProgressEvent) => void) => () => void
    onComplete: (callback: (result: AgentRunResult) => void) => () => void
    onError: (callback: (error: { message: string }) => void) => () => void
  }
  data: {
    listSamples: () => Promise<DatasetSummary[]>
    loadSample: (id: string) => Promise<DatasetContext | null>
    uploadFile: (filePath: string) => Promise<DatasetContext | null>
    uploadText: (text: string, name: string) => Promise<DatasetContext | null>
    preview: (datasetId: string) => Promise<DatasetContext | null>
  }
  dialog: {
    openFile: () => Promise<string | null>
  }
  storage: {
    listDashboards: () => Promise<DashboardSummary[]>
    getDashboard: (id: string) => Promise<Dashboard | null>
    saveDashboard: (dashboard: Partial<Dashboard> & { goal: string }) => Promise<Dashboard>
    deleteDashboard: (id: string) => Promise<void>
  }
  /** 监听主进程发送的 API 端口 */
  onApiPort: (callback: (port: number) => void) => () => void
}

declare global {
  interface Window {
    datapilot: DataPilotAPI
  }
}

export {}
