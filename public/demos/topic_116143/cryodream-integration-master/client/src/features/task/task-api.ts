export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed'
export type TaskCategory = 'knowledge_base' | 'workflow'

export interface TaskStepLog {
  nodeName: string
  nodeType: string
  status: string
  elapsedMs?: number
  via?: string
  errorMessage?: string
}

export interface TaskResult {
  success?: boolean
  engine?: string
  via?: string
  documentId?: string
  kbId?: string
  workflowTemplateId?: string
  steps?: TaskStepLog[]
  [key: string]: unknown
}

export interface Task {
  id: string
  type: string
  category: TaskCategory
  status: TaskStatus
  progress: number
  title: string
  params?: string
  result?: string
  errorMessage?: string
  createTime?: string
  updateTime?: string
}

interface ApiResponse<T> {
  code: number
  data: T
  message?: string
}

const baseUrl = '/api'

export const taskApi = {
  get: async (id: string): Promise<Task> => {
    const response = await fetch(`${baseUrl}/task/get?id=${id}`)
    const result = (await response.json()) as ApiResponse<Task>
    if (result.code !== 0) throw new Error(result.message)
    return result.data
  },

  list: async (params?: { category?: string; status?: string }): Promise<Task[]> => {
    const response = await fetch(`${baseUrl}/task/list`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params || {}),
    })
    const result = (await response.json()) as ApiResponse<Task[]>
    if (result.code !== 0) throw new Error(result.message)
    return result.data
  },

  recent: async (): Promise<Task[]> => {
    const response = await fetch(`${baseUrl}/task/recent`)
    const result = (await response.json()) as ApiResponse<Task[]>
    if (result.code !== 0) throw new Error(result.message)
    return result.data
  },
}
