interface ApiResponse<T> {
  code: number
  data: T
  message: string
}

const baseUrl = '/api'

async function parseResponse<T>(response: Response): Promise<T> {
  const result = (await response.json()) as ApiResponse<T>
  if (result.code !== 0) {
    throw new Error(result.message || '请求失败')
  }
  return result.data
}

export interface Citation {
  index: number
  chunkId: string
  docId: string
  docTitle: string
  source: string
  confidence: number
  claimType: string
  timeStamp: string
  snippet: string
  vectorScore: number
  score: number
}

export interface RewrittenQuery {
  timeRange: string
  domains: string[]
  entities: string[]
  concepts: string[]
  claimTypes: string[]
  minConfidence: number
  topK: number
  originalQuery: string
  semanticQuery: string
}

export interface AnalysisResponse {
  query: string
  report: string
  citations: Citation[]
  retrievedCount: number
  rewrittenQuery?: RewrittenQuery
  elapsedMs: number
}

export interface AnalysisHistory {
  id: string
  kbId: string
  userQuery: string
  rewrittenQuery?: string
  retrievedCount: number
  analysisResult: string
  citations: string
  elapsedMs: number
  createTime: string
}

export interface ChunkDetail {
  id: string
  docId: string
  kbId: string
  chunkIndex: number
  content: string
  chunkText: string
  rawText: string
  metadata: string
}

export const generationApi = {
  analyze: async (kbId: string, query: string, modelConfigId?: string): Promise<AnalysisResponse> => {
    const response = await fetch(`${baseUrl}/generation/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kbId, query, modelConfigId }),
    })
    return parseResponse<AnalysisResponse>(response)
  },

  listHistory: async (kbId?: string, limit = 50): Promise<AnalysisHistory[]> => {
    const params = new URLSearchParams()
    if (kbId) params.set('kbId', kbId)
    params.set('limit', String(limit))
    const response = await fetch(`${baseUrl}/generation/history?${params.toString()}`)
    return parseResponse<AnalysisHistory[]>(response)
  },

  deleteHistory: async (id: string): Promise<boolean> => {
    const response = await fetch(`${baseUrl}/generation/history/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    return parseResponse<boolean>(response)
  },

  getChunk: async (id: string): Promise<ChunkDetail> => {
    const response = await fetch(`${baseUrl}/chunk/get?id=${encodeURIComponent(id)}`)
    return parseResponse<ChunkDetail>(response)
  },
}
