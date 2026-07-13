interface ApiResponse<T> {
  code: number
  data: T
  message: string
}

export interface DocumentItem {
  id: string
  projectId?: string
  title: string
  content?: string | null
  format?: string
  tags?: string
  status?: string
  createTime?: string
  updateTime?: string
}

export interface DocumentAddRequest {
  projectId?: string
  title: string
  content?: string
  format?: string
  tags?: string
}

export interface DocumentUpdateRequest {
  id: string
  title?: string
  content?: string
  tags?: string
  status?: string
}

export interface DocumentQueryRequest {
  current?: number
  pageSize?: number
  projectId?: string
  searchText?: string
  status?: string
}

const baseUrl = '/api'

async function parseResponse<T>(response: Response): Promise<T> {
  const result = (await response.json()) as ApiResponse<T>
  if (result.code !== 0) {
    throw new Error(result.message || '请求失败')
  }
  return result.data
}

export const documentApi = {
  add: async (data: DocumentAddRequest): Promise<string> => {
    const response = await fetch(`${baseUrl}/document/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return parseResponse<string>(response)
  },

  update: async (data: DocumentUpdateRequest): Promise<boolean> => {
    const response = await fetch(`${baseUrl}/document/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return parseResponse<boolean>(response)
  },

  delete: async (id: string): Promise<boolean> => {
    const response = await fetch(`${baseUrl}/document/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    return parseResponse<boolean>(response)
  },

  get: async (id: string): Promise<DocumentItem> => {
    const response = await fetch(`${baseUrl}/document/get?id=${encodeURIComponent(id)}`)
    return parseResponse<DocumentItem>(response)
  },

  list: async (params: DocumentQueryRequest): Promise<{ list: DocumentItem[]; total: number }> => {
    const response = await fetch(`${baseUrl}/document/list/page`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    const data = await parseResponse<{ records: DocumentItem[]; total: number }>(response)
    return { list: data.records, total: data.total }
  },
}
