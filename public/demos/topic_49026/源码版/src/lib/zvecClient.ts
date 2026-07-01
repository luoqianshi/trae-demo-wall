import { getProxyToken } from './config'

const PROXY_BASE_URL = (import.meta.env?.VITE_API_BASE_URL as string | undefined) || '/api'
const API_BASE = `${PROXY_BASE_URL}/vector`

// FIX: 向量服务可用性缓存，避免后端不可用时反复发起 500 请求
let _vectorServiceAvailable: boolean | null = null
let _vectorServiceCheckTs = 0
const VECTOR_HEALTH_CHECK_TTL = 30000 // 30 秒内不重复健康检查

async function request(method: string, path: string, body?: unknown) {
  const url = `${API_BASE}${path}`
  const token = getProxyToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['x-api-token'] = token

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => 'unknown error')
    throw new Error(`Zvec vector API ${path} failed: ${res.status} ${text}`)
  }
  return res.json()
}

// FIX: 检查向量服务是否可用（带缓存）
export async function isVectorServiceAvailable(): Promise<boolean> {
  if (_vectorServiceAvailable !== null && Date.now() - _vectorServiceCheckTs < VECTOR_HEALTH_CHECK_TTL) {
    return _vectorServiceAvailable
  }
  try {
    const url = `${API_BASE}/count`
    const token = getProxyToken()
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) headers['x-api-token'] = token
    const res = await fetch(url, { method: 'GET', headers })
    _vectorServiceAvailable = res.ok
    _vectorServiceCheckTs = Date.now()
    return res.ok
  } catch {
    _vectorServiceAvailable = false
    _vectorServiceCheckTs = Date.now()
    return false
  }
}

// FIX: 重置向量服务可用性缓存（供外部调用）
export function resetVectorServiceCache(): void {
  _vectorServiceAvailable = null
  _vectorServiceCheckTs = 0
}

export interface ZvecIndexItem {
  sourceType: 'memory' | 'diary' | 'person'
  sourceId: string
  text: string
  embedding: number[]
  createdAt: number
}

export interface ZvecSearchOptions {
  queryEmbedding: number[]
  sourceType?: 'memory' | 'diary' | 'person'
  limit?: number
  minSimilarity?: number
}

export interface ZvecSearchResult {
  sourceType: 'memory' | 'diary' | 'person'
  sourceId: string
  text: string
  createdAt: number
  similarity: number
}

export interface ZvecTieredSearchOptions extends ZvecSearchOptions {
  hotLimit?: number
  warmLimit?: number
  coldLimit?: number
  now?: number
}

export interface ZvecTieredResults {
  hot: (ZvecSearchResult & { tier: 'hot' })[]
  warm: (ZvecSearchResult & { tier: 'warm' })[]
  cold: (ZvecSearchResult & { tier: 'cold' })[]
}

export const zvecClient = {
  async index(item: ZvecIndexItem): Promise<void> {
    await request('POST', '/index', item)
  },

  async search(options: ZvecSearchOptions): Promise<ZvecSearchResult[]> {
    const data = await request('POST', '/search', options)
    return data.results as ZvecSearchResult[]
  },

  async tieredSearch(options: ZvecTieredSearchOptions): Promise<ZvecTieredResults> {
    return request('POST', '/tiered-search', options) as Promise<ZvecTieredResults>
  },

  async rebuild(items: ZvecIndexItem[]): Promise<void> {
    await request('POST', '/rebuild', { items })
  },

  async clear(): Promise<void> {
    await request('POST', '/clear', {})
  },

  async count(): Promise<number> {
    const data = await request('GET', '/count')
    return data.count as number
  },
}
