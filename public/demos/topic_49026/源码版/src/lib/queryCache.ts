/**
 * 语义缓存 — Embedding 级查询缓存
 *
 * 企业级技术降维：Redis LangCache / GPTCache → 个人 AI 助手语义缓存
 *
 * 核心思路：
 * - 企业级：用 embedding 相似度判断是否命中缓存，避免重复 API 调用
 * - 个人降维：衡舟的 AI 对话用语义缓存，"王思亮最近怎么样"和"王思亮近况如何"命中同一缓存
 * - 节省 API 调用成本，加速响应
 *
 * v2 升级：从 Jaccard token 相似度 → Embedding 余弦相似度
 * v3 优化：从 localStorage 迁移至 IndexedDB，嵌入向量用 ArrayBuffer 二进制存储
 *          - 解除 localStorage 5MB 限制
 *          - 主线程不阻塞（IndexedDB 异步）
 *          - 嵌入向量体积降 75%（4KB vs 20-30KB JSON）
 */

import { db, float32ArrayToBuffer, bufferToFloat32Array, type QueryCacheRecord } from './db'
import { getEmbeddingsBatch, cosineSimilarity } from './vectorStore'

const CACHE_MAX_SIZE = 500 // 从 30 提升至 500（IndexedDB 无 5MB 限制）
const CACHE_TTL = 10 * 60 * 1000 // 10分钟过期
const SEMANTIC_THRESHOLD = 0.92 // embedding 相似度阈值
const TOKEN_THRESHOLD = 0.75 // token 相似度阈值（降级方案）

// 旧版 localStorage 键名（用于迁移后清理）
const LEGACY_CACHE_KEY = 'hengzhou-query-cache-v2'

// 统计数据（体积极小，仅数字，保留在 localStorage 即可）
interface CacheStats {
  totalQueries: number
  cacheHits: number
  semanticHits: number
  tokenHits: number
  misses: number
  apiCallsSaved: number
  estimatedCostSaved: number // 估算节省的费用（元）
}

const STATS_KEY = 'hengzhou-cache-stats'

// ─── 一次性迁移：localStorage → IndexedDB ────────────────────

let _migrationDone = false

async function migrateFromLocalStorageIfNeeded(): Promise<void> {
  if (_migrationDone) return
  _migrationDone = true

  try {
    const raw = localStorage.getItem(LEGACY_CACHE_KEY)
    if (!raw) return

    const oldEntries: Array<{
      query: string
      queryEmbedding: number[] | null
      ragResult: unknown
      llmResponse: string
      timestamp: number
      hitCount: number
      method: 'semantic' | 'token'
    }> = JSON.parse(raw)

    if (!Array.isArray(oldEntries) || oldEntries.length === 0) {
      localStorage.removeItem(LEGACY_CACHE_KEY)
      return
    }

    console.log(`[QueryCache] 迁移 ${oldEntries.length} 条缓存从 localStorage → IndexedDB`)

    const records: QueryCacheRecord[] = oldEntries.map(e => ({
      query: e.query,
      queryEmbedding: e.queryEmbedding && e.queryEmbedding.length > 0
        ? float32ArrayToBuffer(e.queryEmbedding)
        : null,
      ragResult: e.ragResult,
      llmResponse: e.llmResponse,
      timestamp: e.timestamp,
      hitCount: e.hitCount,
      method: e.method,
    }))

    await db.queryCache.bulkAdd(records)
    localStorage.removeItem(LEGACY_CACHE_KEY)
    console.log('[QueryCache] 迁移完成，已清理 localStorage')
  } catch (err) {
    console.warn('[QueryCache] 迁移失败（非致命）:', err)
  }
}

// ─── IndexedDB 缓存读写 ──────────────────────────────────────

async function getValidCacheEntries(): Promise<QueryCacheRecord[]> {
  await migrateFromLocalStorageIfNeeded()
  const now = Date.now()
  const all = await db.queryCache.toArray()

  // 清理过期条目
  const valid = all.filter(e => now - e.timestamp < CACHE_TTL)
  if (valid.length !== all.length) {
    const expiredIds = all.filter(e => now - e.timestamp >= CACHE_TTL).map(e => e.id!).filter(Boolean)
    if (expiredIds.length > 0) {
      await db.queryCache.bulkDelete(expiredIds)
    }
  }

  return valid
}

async function saveCacheEntry(record: Omit<QueryCacheRecord, 'id'>): Promise<void> {
  await db.queryCache.add(record)

  // LRU 淘汰：超过上限时删除最旧的条目
  const count = await db.queryCache.count()
  if (count > CACHE_MAX_SIZE) {
    const oldest = await db.queryCache.orderBy('timestamp').limit(count - CACHE_MAX_SIZE).toArray()
    const idsToDelete = oldest.map(e => e.id!).filter(Boolean)
    if (idsToDelete.length > 0) {
      await db.queryCache.bulkDelete(idsToDelete)
    }
  }
}

async function updateCacheEntry(id: number, updates: Partial<QueryCacheRecord>): Promise<void> {
  await db.queryCache.update(id, updates)
}

// ─── 统计（保留 localStorage，体积极小）────────────────────────

function getStats(): CacheStats {
  try {
    const parsed = JSON.parse(localStorage.getItem(STATS_KEY) || '{}')
    return {
      totalQueries: parsed.totalQueries || 0,
      cacheHits: parsed.cacheHits || 0,
      semanticHits: parsed.semanticHits || 0,
      tokenHits: parsed.tokenHits || 0,
      misses: parsed.misses || 0,
      apiCallsSaved: parsed.apiCallsSaved || 0,
      estimatedCostSaved: parsed.estimatedCostSaved || 0,
    }
  } catch {
    return {
      totalQueries: 0,
      cacheHits: 0,
      semanticHits: 0,
      tokenHits: 0,
      misses: 0,
      apiCallsSaved: 0,
      estimatedCostSaved: 0,
    }
  }
}

function saveStats(stats: CacheStats) {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats))
}

// ─── Token 相似度（降级方案）──────────────────────────────

function extractChineseTokens(query: string): Set<string> {
  const tokens = new Set<string>()
  const englishParts = query.split(/[^a-z0-9]+/i).filter(w => w.length >= 2)
  englishParts.forEach(w => tokens.add(w.toLowerCase()))
  const chineseSegments = query.match(/[\u4e00-\u9fa5]+/g) || []
  for (const seg of chineseSegments) {
    for (let i = 0; i <= seg.length - 2; i++) {
      tokens.add(seg.slice(i, i + 2))
    }
    for (let i = 0; i <= seg.length - 3; i++) {
      tokens.add(seg.slice(i, i + 3))
    }
  }
  return tokens
}

function tokenSimilarity(a: string, b: string): number {
  const setA = extractChineseTokens(a.toLowerCase())
  const setB = extractChineseTokens(b.toLowerCase())
  if (setA.size === 0 || setB.size === 0) return 0
  const intersection = new Set([...setA].filter(w => setB.has(w)))
  return intersection.size / Math.max(setA.size, setB.size)
}

// ─── 语义缓存查找 ───────────────────────────────────────────

/**
 * 查找缓存
 * 优先用 embedding 语义相似度，降级为 token 相似度
 */
export async function findCachedQuery(query: string): Promise<{
  entry: { ragResult: unknown; llmResponse: string } | null
  method: 'semantic' | 'token' | 'miss'
  similarity: number
}> {
  const valid = await getValidCacheEntries()

  // 尝试生成查询的 embedding
  let queryEmbedding: number[] | null = null
  try {
    const embeddings = await getEmbeddingsBatch([query])
    if (embeddings.length > 0 && embeddings[0].length > 0) {
      queryEmbedding = embeddings[0]
    }
  } catch {
    // embedding 生成失败，降级为 token 相似度
  }

  // 优先：embedding 语义匹配
  if (queryEmbedding) {
    for (const entry of valid) {
      if (entry.queryEmbedding && entry.queryEmbedding.byteLength > 0) {
        const cachedEmbedding = bufferToFloat32Array(entry.queryEmbedding)
        const sim = cosineSimilarity(queryEmbedding, cachedEmbedding)
        if (sim >= SEMANTIC_THRESHOLD) {
          // 更新命中次数
          if (entry.id) {
            await updateCacheEntry(entry.id, { hitCount: entry.hitCount + 1 })
          }
          updateStats('semantic')
          return {
            entry: { ragResult: entry.ragResult, llmResponse: entry.llmResponse },
            method: 'semantic',
            similarity: sim,
          }
        }
      }
    }
  }

  // 降级：token 相似度匹配
  for (const entry of valid) {
    const sim = tokenSimilarity(entry.query, query)
    if (sim >= TOKEN_THRESHOLD) {
      if (entry.id) {
        await updateCacheEntry(entry.id, { hitCount: entry.hitCount + 1 })
      }
      updateStats('token')
      return {
        entry: { ragResult: entry.ragResult, llmResponse: entry.llmResponse },
        method: 'token',
        similarity: sim,
      }
    }
  }

  // 未命中
  updateStats('miss')
  return { entry: null, method: 'miss', similarity: 0 }
}

/**
 * 存入缓存（异步，因为需要生成 embedding）
 */
export async function cacheQuery(query: string, ragResult: unknown, llmResponse: string): Promise<void> {
  // 生成查询 embedding
  let queryEmbedding: number[] | null = null
  try {
    const embeddings = await getEmbeddingsBatch([query])
    if (embeddings.length > 0 && embeddings[0].length > 0) {
      queryEmbedding = embeddings[0]
    }
  } catch {
    // embedding 生成失败也能缓存，只是降级为 token 匹配
  }

  await saveCacheEntry({
    query,
    queryEmbedding: queryEmbedding ? float32ArrayToBuffer(queryEmbedding) : null,
    ragResult,
    llmResponse,
    timestamp: Date.now(),
    hitCount: 0,
    method: 'semantic',
  })
}

// ─── 统计 ───────────────────────────────────────────────────

function updateStats(hitType: 'semantic' | 'token' | 'miss') {
  const stats = getStats()
  stats.totalQueries++

  if (hitType === 'semantic') {
    stats.cacheHits++
    stats.semanticHits++
    stats.apiCallsSaved++
    stats.estimatedCostSaved += 0.05 // 每次API调用约省0.05元
  } else if (hitType === 'token') {
    stats.cacheHits++
    stats.tokenHits++
    stats.apiCallsSaved++
    stats.estimatedCostSaved += 0.05
  } else {
    stats.misses++
  }

  saveStats(stats)
}

/**
 * 获取缓存统计信息（用于 UI 展示）
 * 异步：cacheSize 需要从 IndexedDB 查询
 */
export async function getCacheStats(): Promise<CacheStats & {
  hitRate: number
  cacheSize: number
}> {
  const stats = getStats()
  const cacheSize = await db.queryCache.count()
  const hitRate = stats.totalQueries > 0
    ? Math.round((stats.cacheHits / stats.totalQueries) * 100)
    : 0

  return {
    ...stats,
    hitRate,
    cacheSize,
  }
}

/**
 * 清空缓存
 */
export async function clearQueryCache() {
  await db.queryCache.clear()
  localStorage.removeItem(STATS_KEY)
  localStorage.removeItem(LEGACY_CACHE_KEY)
}
