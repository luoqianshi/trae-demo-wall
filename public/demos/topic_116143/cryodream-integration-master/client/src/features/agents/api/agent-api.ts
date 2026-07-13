interface ApiResponse<T> {
  code: number
  data: T
  message?: string
}

export interface AgentCoreMemory {
  name: string
  description: string
  role: string
  instructions: string
  personality?: string
  constraints?: string[]
}

export interface Agent {
  id: string
  name: string
  description: string
  avatar: string
  status: 'active' | 'inactive' | 'training'
  projectId?: string
  workflowIds?: string[]
  workflowNames?: string[]
  knowledgeBaseIds?: string[]
  knowledgeBaseNames?: string[]
  modelConfigId?: string
  modelConfigName?: string
  coreMemory?: AgentCoreMemory
  createTime?: string
  updateTime?: string
  lastUsedTime?: string
}

export interface AgentAddRequest {
  name: string
  description?: string
  avatar?: string
  workflowIds?: string[]
  knowledgeBaseIds?: string[]
  modelConfigId?: string
  coreMemory?: AgentCoreMemory
}

export interface AgentUpdateRequest {
  id: string
  name?: string
  description?: string
  avatar?: string
  status?: string
  workflowIds?: string[]
  knowledgeBaseIds?: string[]
  modelConfigId?: string
  coreMemory?: AgentCoreMemory
}

export interface AgentQueryRequest {
  id?: string
  name?: string
  status?: string
  knowledgeBaseId?: string
  workflowId?: string
}

const baseUrl = '/api/agent'

async function parseResponse<T>(response: Response): Promise<T> {
  const result = (await response.json()) as ApiResponse<T>
  if (result.code !== 0) {
    throw new Error(result.message || '请求失败')
  }
  return result.data
}

export const agentApi = {
  add: async (data: AgentAddRequest): Promise<string> => {
    const response = await fetch(`${baseUrl}/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return parseResponse<string>(response)
  },

  update: async (data: AgentUpdateRequest): Promise<boolean> => {
    const response = await fetch(`${baseUrl}/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return parseResponse<boolean>(response)
  },

  delete: async (id: string): Promise<boolean> => {
    const response = await fetch(`${baseUrl}/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    return parseResponse<boolean>(response)
  },

  get: async (id: string): Promise<Agent> => {
    const response = await fetch(`${baseUrl}/get?id=${encodeURIComponent(id)}`)
    return parseResponse<Agent>(response)
  },

  list: async (params?: AgentQueryRequest): Promise<Agent[]> => {
    const response = await fetch(`${baseUrl}/list`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params || {}),
    })
    return parseResponse<Agent[]>(response)
  },
}