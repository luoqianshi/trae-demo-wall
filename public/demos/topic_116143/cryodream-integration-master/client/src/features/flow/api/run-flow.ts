import type { FlowData } from '../types'

interface ApiResponse<T> {
  code: number
  data: T
  message?: string
}

export interface RunFlowRequest {
  flowId: string
  inputValue: string
  startNodeId?: string
  sessionId?: string
  flow: Pick<FlowData, 'nodes' | 'edges'> & { viewport?: Record<string, unknown> }
}

export interface RunFlowMessage {
  role: string
  content: string
}

export interface RunFlowStep {
  nodeId: string
  nodeName: string
  nodeType: string
  status: 'SUCCESS' | 'FAILED'
  input?: Record<string, unknown>
  output?: Record<string, unknown>
  elapsedMs?: number
  errorMessage?: string | null
}

export interface RunFlowResponse {
  runId: string
  status: 'SUCCESS' | 'FAILED'
  outputText: string
  outputs?: Record<string, unknown>
  messages: RunFlowMessage[]
  steps: RunFlowStep[]
  errorMessage?: string | null
}

export const runFlow = async (payload: RunFlowRequest) => {
  const response = await fetch('/api/flow/run', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`工作流执行接口请求失败：${response.status}`)
  }

  const result = (await response.json()) as ApiResponse<RunFlowResponse>
  if (result.code !== 0) {
    throw new Error(result.message || '工作流执行失败')
  }

  return result.data
}
