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

export interface RetrievedChunk {
  chunkId: string
  docId: string
  kbId: string
  chunkIndex?: number
  chunkText: string
  rawText: string
  metadata?: string
  vectorScore: number
  score: number
  docTitle?: string
  docFileType?: string
}

export interface RetrievalResponse {
  chunks: RetrievedChunk[]
  totalCount: number
  rewrittenQuery?: RewrittenQuery
  elapsedMs: number
}

export const retrievalApi = {
  rewriteQuery: async (query: string, modelConfigId?: string): Promise<RewrittenQuery> => {
    const response = await fetch(`${baseUrl}/retrieval/rewriteQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, modelConfigId }),
    })
    return parseResponse<RewrittenQuery>(response)
  },

  vectorSearch: async (kbId: string, query: string, topK = 10): Promise<RetrievalResponse> => {
    const response = await fetch(`${baseUrl}/retrieval/vectorSearch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kbId, query, topK }),
    })
    return parseResponse<RetrievalResponse>(response)
  },

  hybridSearch: async (kbId: string, query: string, modelConfigId?: string): Promise<RetrievalResponse> => {
    const response = await fetch(`${baseUrl}/retrieval/hybridSearch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kbId, query, modelConfigId }),
    })
    return parseResponse<RetrievalResponse>(response)
  },
}
