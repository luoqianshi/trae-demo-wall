// 向量存储管理器
// 负责将记忆/日记/人物索引为向量，并支持语义检索
// v3: 后端使用 Zvec 向量数据库存储与检索，前端通过 HTTP 调用本地服务

import { db, type EmbeddingRecord } from './db'
import { getEmbedding, quickEmbedProbe, isBackendUnavailable } from './ai'
import { zvecClient, isVectorServiceAvailable } from './zvecClient'

// 余弦相似度计算（支持 number[] 和 ArrayBuffer 二进制格式）
export function cosineSimilarity(
  a: number[] | ArrayBuffer,
  b: number[] | ArrayBuffer
): number {
  const arrA = a instanceof ArrayBuffer ? Array.from(new Float32Array(a)) : a
  const arrB = b instanceof ArrayBuffer ? Array.from(new Float32Array(b)) : b
  if (arrA.length === 0 || arrB.length === 0 || arrA.length !== arrB.length) return 0
  let dotProduct = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < arrA.length; i++) {
    dotProduct += arrA[i] * arrB[i]
    normA += arrA[i] * arrA[i]
    normB += arrB[i] * arrB[i]
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-8)
}

// FIX-1: 带重试的单条嵌入获取（最多重试 2 次，间隔 1s）
async function getEmbeddingWithRetry(text: string, maxRetries = 2): Promise<number[]> {
  // FIX: 后端不可用时直接返回空，避免无意义的重试
  if (isBackendUnavailable()) return []
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await getEmbedding(text)
      if (result.length > 0) return result
      // 空结果也算失败，进入重试
      if (attempt < maxRetries) {
        console.warn(`[VectorStore] 嵌入返回空结果，重试 ${attempt + 1}/${maxRetries}...`)
        await new Promise(r => setTimeout(r, 1000))
      }
    } catch (err) {
      if (attempt < maxRetries) {
        console.warn(`[VectorStore] 嵌入失败(${attempt + 1}/${maxRetries}):`, err instanceof Error ? err.message : String(err))
        await new Promise(r => setTimeout(r, 1000))
      } else {
        console.warn(`[VectorStore] 嵌入最终失败(已重试${maxRetries}次):`, text.slice(0, 50))
      }
    }
  }
  return []
}

// 批量获取嵌入（带并发控制 + FIX-1 重试机制）
export async function getEmbeddingsBatch(texts: string[], concurrency = 3): Promise<number[][]> {
  const results: number[][] = []
  for (let i = 0; i < texts.length; i += concurrency) {
    const batch = texts.slice(i, i + concurrency)
    const batchResults = await Promise.all(batch.map(t => getEmbeddingWithRetry(t)))
    results.push(...batchResults)
    // FIX-1: 批次间添加 200ms 间隔，避免 API 限流
    if (i + concurrency < texts.length) {
      await new Promise(r => setTimeout(r, 200))
    }
  }
  return results
}

// 索引一条记忆到向量存储
export async function indexMemory(memory: { id: string; content: string; createdAt?: number }): Promise<void> {
  // FIX: 先检查向量服务可用性，避免后端不可用时抛错
  const available = await isVectorServiceAvailable()
  if (!available) {
    console.warn('[VectorStore] 向量服务不可用，跳过记忆索引:', memory.id)
    return
  }
  const embedding = await getEmbedding(memory.content)
  if (embedding.length === 0) return

  try {
    await zvecClient.index({
      sourceType: 'memory',
      sourceId: memory.id,
      text: memory.content,
      embedding,
      createdAt: memory.createdAt ?? Date.now(),
    })
  } catch (err) {
    console.warn('[VectorStore] indexMemory failed:', err instanceof Error ? err.message : String(err))
  }
}

// 索引一条日记到向量存储
export async function indexDiary(diary: { id: string; content: string; timestamp?: number }): Promise<void> {
  // FIX: 先检查向量服务可用性
  const available = await isVectorServiceAvailable()
  if (!available) {
    console.warn('[VectorStore] 向量服务不可用，跳过日记索引:', diary.id)
    return
  }
  const embedding = await getEmbedding(diary.content)
  if (embedding.length === 0) return

  try {
    await zvecClient.index({
      sourceType: 'diary',
      sourceId: diary.id,
      text: diary.content,
      embedding,
      createdAt: diary.timestamp ?? Date.now(),
    })
  } catch (err) {
    console.warn('[VectorStore] indexDiary failed:', err instanceof Error ? err.message : String(err))
  }
}

// 索引人物描述到向量存储（支持丰满档案）
export async function indexPerson(person: { id: string; name: string; traits: string[]; profileText?: string; createdAt?: number }): Promise<void> {
  // FIX: 先检查向量服务可用性
  const available = await isVectorServiceAvailable()
  if (!available) {
    console.warn('[VectorStore] 向量服务不可用，跳过人物索引:', person.id)
    return
  }
  const text = person.profileText || `${person.name} ${person.traits.join(' ')}`
  const embedding = await getEmbedding(text)
  if (embedding.length === 0) return

  try {
    await zvecClient.index({
      sourceType: 'person',
      sourceId: person.id,
      text,
      embedding,
      createdAt: person.createdAt ?? Date.now(),
    })
  } catch (err) {
    console.warn('[VectorStore] indexPerson failed:', err instanceof Error ? err.message : String(err))
  }
}

function toEmbeddingRecord(r: {
  sourceType: string
  sourceId: string
  text: string
  createdAt: number
  similarity: number
}): EmbeddingRecord & { similarity: number } {
  return {
    sourceType: r.sourceType as 'memory' | 'diary' | 'person',
    sourceId: r.sourceId,
    text: r.text,
    createdAt: r.createdAt,
    embedding: [],
    similarity: r.similarity,
  }
}

// 语义检索：根据查询向量找到最相关的记录
export async function semanticSearch(
  query: string,
  options?: {
    sourceType?: 'memory' | 'diary' | 'person'
    limit?: number
    minSimilarity?: number
  }
): Promise<Array<EmbeddingRecord & { similarity: number }>> {
  const { sourceType, limit = 10, minSimilarity = 0.3 } = options || {}

  // FIX: 后端不可用时直接走本地关键词降级，跳过所有向量请求
  if (isBackendUnavailable()) {
    return localKeywordSearch(query, sourceType, limit)
  }

  // FIX: 先检查向量服务可用性，不可用时直接走本地关键词降级
  const vectorAvailable = await isVectorServiceAvailable()
  if (!vectorAvailable) {
    console.warn('[VectorStore] 向量服务不可用，降级为本地关键词搜索')
    return localKeywordSearch(query, sourceType, limit)
  }

  const queryEmbedding = await getEmbedding(query)
  if (queryEmbedding.length === 0) {
    // embedding 失败也降级为关键词搜索
    return localKeywordSearch(query, sourceType, limit)
  }

  try {
    const results = await zvecClient.search({
      queryEmbedding,
      sourceType,
      limit,
      minSimilarity,
    })
    const mapped = results.map(toEmbeddingRecord)
    // FIX: 向量搜索结果为空时也尝试关键词降级
    if (mapped.length === 0) {
      return localKeywordSearch(query, sourceType, limit)
    }
    return mapped
  } catch (err) {
    console.warn('[VectorStore] semanticSearch failed, 降级为关键词搜索:', err instanceof Error ? err.message : String(err))
    return localKeywordSearch(query, sourceType, limit)
  }
}

// FIX: 本地关键词搜索降级 —— 当向量服务不可用时，从 IndexedDB 中按关键词匹配
async function localKeywordSearch(
  query: string,
  sourceType: 'memory' | 'diary' | 'person' | undefined,
  limit: number
): Promise<Array<EmbeddingRecord & { similarity: number }>> {
  const keywords = query.toLowerCase().split(/\s+/).filter(k => k.length > 0)
  if (keywords.length === 0) return []

  const results: Array<EmbeddingRecord & { similarity: number }> = []

  try {
    if (!sourceType || sourceType === 'memory') {
      const memories = await db.memories.toArray()
      for (const m of memories) {
        const content = m.content.toLowerCase()
        const score = keywords.reduce((acc, kw) => acc + (content.includes(kw) ? 1 : 0), 0)
        if (score > 0) {
          results.push({
            sourceType: 'memory',
            sourceId: m.id,
            text: m.content,
            createdAt: m.createdAt || Date.now(),
            embedding: [],
            similarity: score / keywords.length,
          })
        }
      }
    }

    if (!sourceType || sourceType === 'diary') {
      const diaries = await db.diaries.toArray()
      for (const d of diaries) {
        const content = d.content.toLowerCase()
        const score = keywords.reduce((acc, kw) => acc + (content.includes(kw) ? 1 : 0), 0)
        if (score > 0) {
          results.push({
            sourceType: 'diary',
            sourceId: d.id,
            text: d.content,
            createdAt: d.timestamp || Date.now(),
            embedding: [],
            similarity: score / keywords.length,
          })
        }
      }
    }

    if (!sourceType || sourceType === 'person') {
      const persons = await db.persons.toArray()
      for (const p of persons) {
        const text = `${p.name} ${(p.traits || []).join(' ')}`.toLowerCase()
        const score = keywords.reduce((acc, kw) => acc + (text.includes(kw) ? 1 : 0), 0)
        if (score > 0) {
          results.push({
            sourceType: 'person',
            sourceId: p.id,
            text: `${p.name} ${(p.traits || []).join(' ')}`,
            createdAt: p.createdAt || Date.now(),
            embedding: [],
            similarity: score / keywords.length,
          })
        }
      }
    }
  } catch (err) {
    console.warn('[VectorStore] localKeywordSearch failed:', err instanceof Error ? err.message : String(err))
  }

  return results.sort((a, b) => b.similarity - a.similarity).slice(0, limit)
}

// 分层检索：热/温/冷三级，优先热层，其次温层，最后冷层
export async function tieredSearch(
  query: string,
  options?: {
    sourceType?: 'memory' | 'diary' | 'person'
    hotLimit?: number
    warmLimit?: number
    coldLimit?: number
    minSimilarity?: number
  }
): Promise<{
  hot: Array<EmbeddingRecord & { similarity: number; tier: 'hot' }>
  warm: Array<EmbeddingRecord & { similarity: number; tier: 'warm' }>
  cold: Array<EmbeddingRecord & { similarity: number; tier: 'cold' }>
  summary: string
}> {
  const { sourceType, hotLimit = 5, warmLimit = 5, coldLimit = 3, minSimilarity = 0.25 } = options || {}

  // FIX: 后端不可用时直接降级为本地关键词搜索
  if (isBackendUnavailable()) {
    console.warn('[VectorStore] 后端不可用，tieredSearch 降级为关键词搜索')
    return localTieredKeywordSearch(query, sourceType, hotLimit, warmLimit, coldLimit)
  }

  // FIX: 先检查向量服务可用性，不可用时降级为本地关键词搜索
  const vectorAvailable = await isVectorServiceAvailable()
  if (!vectorAvailable) {
    console.warn('[VectorStore] 向量服务不可用，tieredSearch 降级为关键词搜索')
    return localTieredKeywordSearch(query, sourceType, hotLimit, warmLimit, coldLimit)
  }

  const queryEmbedding = await getEmbedding(query)
  if (queryEmbedding.length === 0) {
    return localTieredKeywordSearch(query, sourceType, hotLimit, warmLimit, coldLimit)
  }

  try {
    const tiers = await zvecClient.tieredSearch({
      queryEmbedding,
      sourceType,
      hotLimit,
      warmLimit,
      coldLimit,
      minSimilarity,
    })

    const hot = tiers.hot.map(toEmbeddingRecord) as Array<EmbeddingRecord & { similarity: number; tier: 'hot' }>
    const warm = tiers.warm.map(toEmbeddingRecord) as Array<EmbeddingRecord & { similarity: number; tier: 'warm' }>
    const cold = tiers.cold.map(toEmbeddingRecord) as Array<EmbeddingRecord & { similarity: number; tier: 'cold' }>
    const summary = buildTierSummary(hot, warm, cold)

    // FIX: 向量搜索全部为空时降级
    if (hot.length === 0 && warm.length === 0 && cold.length === 0) {
      return localTieredKeywordSearch(query, sourceType, hotLimit, warmLimit, coldLimit)
    }

    return { hot, warm, cold, summary }
  } catch (err) {
    console.warn('[VectorStore] tieredSearch failed, 降级为关键词搜索:', err instanceof Error ? err.message : String(err))
    return localTieredKeywordSearch(query, sourceType, hotLimit, warmLimit, coldLimit)
  }
}

// FIX: 本地关键词分层搜索降级 —— 按时间分层返回关键词匹配结果
async function localTieredKeywordSearch(
  query: string,
  sourceType: 'memory' | 'diary' | 'person' | undefined,
  hotLimit: number,
  warmLimit: number,
  coldLimit: number,
): Promise<{
  hot: Array<EmbeddingRecord & { similarity: number; tier: 'hot' }>
  warm: Array<EmbeddingRecord & { similarity: number; tier: 'warm' }>
  cold: Array<EmbeddingRecord & { similarity: number; tier: 'cold' }>
  summary: string
}> {
  const now = Date.now()
  const HOT_THRESHOLD = now - 7 * 24 * 60 * 60 * 1000      // 7 天内
  const WARM_THRESHOLD = now - 90 * 24 * 60 * 60 * 1000     // 90 天内

  const all = await localKeywordSearch(query, sourceType, hotLimit + warmLimit + coldLimit)

  const hot = all.filter(r => r.createdAt >= HOT_THRESHOLD).slice(0, hotLimit)
    .map(r => ({ ...r, tier: 'hot' as const }))
  const warm = all.filter(r => r.createdAt < HOT_THRESHOLD && r.createdAt >= WARM_THRESHOLD).slice(0, warmLimit)
    .map(r => ({ ...r, tier: 'warm' as const }))
  const cold = all.filter(r => r.createdAt < WARM_THRESHOLD).slice(0, coldLimit)
    .map(r => ({ ...r, tier: 'cold' as const }))

  const summary = buildTierSummary(hot, warm, cold)
  return { hot, warm, cold, summary }
}

function buildTierSummary(
  hot: Array<EmbeddingRecord & { similarity: number }>,
  warm: Array<EmbeddingRecord & { similarity: number }>,
  cold: Array<EmbeddingRecord & { similarity: number }>
): string {
  const parts: string[] = []
  const HOT_ICON = '🔥', WARM_ICON = '💡', COLD_ICON = '📖'

  if (hot.length > 0) {
    parts.push(`${HOT_ICON} 近期记忆：`)
    hot.slice(0, 3).forEach(r => parts.push(`- ${r.text.slice(0, 60)}`))
  }
  if (warm.length > 0) {
    parts.push(`${WARM_ICON} 近三个月：`)
    warm.slice(0, 2).forEach(r => parts.push(`- ${r.text.slice(0, 60)}`))
  }
  if (cold.length > 0) {
    parts.push(`${COLD_ICON} 历史记录：`)
    cold.slice(0, 1).forEach(r => parts.push(`- ${r.text.slice(0, 60)}`))
  }
  return parts.join('\n') || ''
}

// 批量重建索引（用于初始化或数据变更后）
export async function rebuildIndex(onProgress?: (current: number, total: number) => void): Promise<void> {
  console.log('[VectorStore] 开始重建索引...')

  // FIX: 后端不可用时直接跳过，避免无效请求
  if (isBackendUnavailable()) {
    console.warn('[VectorStore] 后端不可用，跳过向量索引构建')
    localStorage.setItem('hengzhou-vector-index-status', 'failed')
    return
  }

  // FIX: 先检查向量服务是否可用，避免后端不可用时发起 500 请求
  const vectorAvailable = await isVectorServiceAvailable()
  if (!vectorAvailable) {
    console.warn('[VectorStore] 向量服务不可用，跳过向量索引构建（将使用关键词检索降级）')
    localStorage.setItem('hengzhou-vector-index-status', 'failed')
    return
  }

  const embeddingAvailable = await quickEmbedProbe()
  if (!embeddingAvailable) {
    console.warn('[VectorStore] embedding 服务不可用，跳过向量索引构建（将使用关键词检索降级）')
    // 持久化标记，让应用知道向量索引未建立，下次启动时重试
    localStorage.setItem('hengzhou-vector-index-status', 'failed')
    return
  }

  // 标记为构建中
  localStorage.setItem('hengzhou-vector-index-status', 'building')

  // 清空远端向量索引
  try {
    await zvecClient.clear()
  } catch (err) {
    console.warn('[VectorStore] clear failed:', err instanceof Error ? err.message : String(err))
  }

  const memories = await db.memories.toArray()
  const diaries = await db.diaries.toArray()
  const persons = await db.persons.toArray()

  const items: {
    sourceType: 'memory' | 'diary' | 'person'
    sourceId: string
    text: string
    embedding: number[]
    createdAt: number
  }[] = []

  const memoryTexts = memories.map(m => m.content)
  const diaryTexts = diaries.map(d => d.content)
  // FIX-1: 丰富人物档案索引文本，包含角色、描述、标签，提升语义检索召回率
  const personTexts = persons.map(p => {
    const parts: string[] = [p.name]
    // 角色定位（如"运营部内容组长"、"父亲"、"心理咨询师"）
    const roleInMyLife = p.profile?.socialRole?.roleInMyLife
    if (roleInMyLife) parts.push(roleInMyLife)
    // 性格描述
    const description = p.profile?.personality?.description
    if (description) parts.push(description)
    // 特质标签
    if (p.traits && p.traits.length > 0) parts.push(...p.traits)
    // 自动标签
    if (p.tags && p.tags.length > 0) parts.push(...p.tags)
    // 职业信息
    if (p.profile?.career?.company) parts.push(p.profile.career.company)
    if (p.profile?.career?.title) parts.push(p.profile.career.title)
    return parts.join(' ')
  })

  const allTexts = [...memoryTexts, ...diaryTexts, ...personTexts]
  const allEmbeddings = await getEmbeddingsBatch(allTexts, 3)

  let idx = 0
  for (const mem of memories) {
    items.push({
      sourceType: 'memory',
      sourceId: mem.id,
      text: mem.content,
      embedding: allEmbeddings[idx++],
      createdAt: mem.createdAt,
    })
  }
  for (const diary of diaries) {
    items.push({
      sourceType: 'diary',
      sourceId: diary.id,
      text: diary.content,
      embedding: allEmbeddings[idx++],
      createdAt: diary.timestamp,
    })
  }
  for (let pIdx = 0; pIdx < persons.length; pIdx++) {
    const person = persons[pIdx]
    items.push({
      sourceType: 'person',
      sourceId: person.id,
      text: personTexts[pIdx],
      embedding: allEmbeddings[idx++],
      createdAt: person.createdAt,
    })
  }

  const validItems = items.filter(i => i.embedding.length > 0)
  await zvecClient.rebuild(validItems)

  // FIX-1: 覆盖率校验 — 检查是否有嵌入失败的记录
  const totalRecords = memories.length + diaries.length + persons.length
  const failedCount = totalRecords - validItems.length
  const coverage = totalRecords > 0 ? (validItems.length / totalRecords * 100).toFixed(1) : '0'

  if (failedCount > 0) {
    console.warn(`[VectorStore] ⚠️ 索引覆盖率: ${coverage}% (${validItems.length}/${totalRecords})，${failedCount} 条记录嵌入失败`)
    // 记录失败的 sourceId 便于排查
    const failedItems = items.filter(i => i.embedding.length === 0)
    const failedIds = failedItems.map(i => `${i.sourceType}:${i.sourceId}`).slice(0, 10)
    console.warn(`[VectorStore] 失败记录示例: ${failedIds.join(', ')}...`)
  } else {
    console.log(`[VectorStore] ✅ 索引覆盖率: 100% (${validItems.length}/${totalRecords})`)
  }

  if (onProgress) {
    onProgress(validItems.length, validItems.length)
  }

  console.log(`[VectorStore] 重建完成：${validItems.length} 条记录`)
  // 标记为成功
  localStorage.setItem('hengzhou-vector-index-status', 'ready')
  localStorage.setItem('hengzhou-vector-index-built-at', Date.now().toString())
}

// 检查向量索引是否就绪（供 UI 显示状态）
export function getVectorIndexStatus(): 'ready' | 'building' | 'failed' | 'unknown' {
  return (localStorage.getItem('hengzhou-vector-index-status') as 'ready' | 'building' | 'failed' | 'unknown') || 'unknown'
}

// 如果之前失败，尝试重试（带防频繁重试保护）
const RETRY_COOLDOWN_KEY = 'hengzhou-vector-index-retry-at'
const RETRY_COOLDOWN_MS = 5 * 60 * 1000 // 5 分钟内不重复重试

export async function retryIndexIfNeeded(): Promise<void> {
  const status = getVectorIndexStatus()
  if (status === 'failed' || status === 'unknown') {
    // FIX: 防频繁重试 —— 5 分钟内不重复尝试
    const lastRetry = parseInt(localStorage.getItem(RETRY_COOLDOWN_KEY) || '0', 10)
    if (Date.now() - lastRetry < RETRY_COOLDOWN_MS) {
      console.log('[VectorStore] 重试冷却中，跳过（距上次重试不足 5 分钟）')
      return
    }
    localStorage.setItem(RETRY_COOLDOWN_KEY, Date.now().toString())
    console.log('[VectorStore] 检测到向量索引未建立，尝试重新构建...')
    try {
      await rebuildIndex()
    } catch (e) {
      console.warn('[VectorStore] 重试失败:', e)
    }
  }
}

// 检查索引是否需要更新
export async function getEmbeddingCount(): Promise<number> {
  // FIX: 后端不可用时直接返回 0，避免无效网络请求
  if (isBackendUnavailable()) return 0
  try {
    return await zvecClient.count()
  } catch (err) {
    console.warn('[VectorStore] getEmbeddingCount failed:', err instanceof Error ? err.message : String(err))
    return 0
  }
}
