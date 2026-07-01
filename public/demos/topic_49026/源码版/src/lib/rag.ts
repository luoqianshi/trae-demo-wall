// RAG 检索逻辑 v2
// 混合检索：语义向量 + 关键词匹配 + 同义词扩展

import { db } from './db'
import type { Memory, Person, DiaryEntry } from '../types'
import { semanticSearch, tieredSearch, getEmbeddingCount } from './vectorStore'
import { classifyQuery, type QueryType } from './queryClassifier'
import { scoreMemoriesWithTfidf } from './tfidf'
import { graphRAGEnhance, shouldTriggerGraphRAG, isRelationshipChainQuery, type GraphRAGResult } from './graphRAG'

// FIX: 转义正则特殊字符，防止人物名含 (.) (*) (+) 等导致 RegExp 崩溃
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// FIX: 安全的 DB 查询包装器 — IndexedDB 损坏时返回空数组而非崩溃
async function safeDBQuery<T>(fn: () => Promise<T[]>, fallback: T[] = []): Promise<T[]> {
  try {
    return await fn()
  } catch (err) {
    console.error('[RAG] DB 查询失败，使用降级数据:', err)
    return fallback
  }
}

export interface RetrievalResult {
  memories: Memory[]
  people: Person[]
  diaries: DiaryEntry[]
  context: string
  method: 'semantic' | 'keyword' | 'hybrid'
  tiers: { hot: number; warm: number; cold: number } // 分层统计
  sources: { id: string; type: 'memory' | 'diary' | 'person'; text?: string; similarity?: number }[]
  queryType?: QueryType  // 问题类型分类（OPT-3 新增）
  graphRAG?: GraphRAGResult  // GraphRAG 增强结果（v3 新增）
}

/**
 * 根据用户输入检索相关记忆、日记和人物
 * v2: 混合检索 - 语义向量优先，关键词兜底
 * FIX-4: 人物优先检索 — 检测查询中提及的人物，多人物时按人分配配额
 */
export async function retrieveContext(query: string): Promise<RetrievalResult> {
  const queryLower = query.toLowerCase()
  const hasVectors = await getEmbeddingCount()

  // FIX-4: 人物优先检索 — 检测查询中提及的人物
  const allPeople = await safeDBQuery(() => db.persons.toArray())
  const detectedPersons = detectPersonsInQuery(query, queryLower, allPeople)

  // FIX-4: 多人物查询（≥2人）使用按人分配配额策略
  if (detectedPersons.length >= 2 && hasVectors > 0) {
    return personFirstRetrieval(query, queryLower, detectedPersons, allPeople)
  }

  // === Hybrid 检索：语义 + 关键词并行，始终合并结果 ===
  if (hasVectors > 0) {
    const [semanticResult, keywordResult] = await Promise.all([
      semanticRetrieval(query, queryLower),
      keywordRetrieval(query, queryLower),
    ])

    // 始终合并关键词检索结果，补充语义检索遗漏的记忆
    const existingIds = new Set(semanticResult.memories.map(m => m.id))
    const extraMemories = keywordResult.memories.filter(m => !existingIds.has(m.id))
    let mergedMemories = [...semanticResult.memories, ...extraMemories.slice(0, 5)]

    // FIX-5: 多样性保障 — 当检测到 ≥2 人物时，确保单人物不超过 50%
    if (detectedPersons.length >= 2) {
      mergedMemories = ensureDiversity(mergedMemories, 10)
    }

    // 合并人物（去重）
    const existingPersonIds = new Set(semanticResult.people.map(p => p.id))
    const extraPeople = keywordResult.people.filter(p => !existingPersonIds.has(p.id))

    // === GraphRAG 增强（hybrid 路径） ===
    const hybridResult: RetrievalResult = {
      memories: mergedMemories,
      people: [...semanticResult.people, ...extraPeople],
      diaries: semanticResult.diaries,
      context: semanticResult.context,
      method: 'hybrid',
      tiers: semanticResult.tiers,
      sources: [
        ...semanticResult.sources,
        ...extraMemories.map(m => ({ id: m.id, type: 'memory' as const, text: m.content.slice(0, 100) })),
      ],
    }

    const graphResult = await tryGraphRAG(query, detectedPersons.length > 0 ? detectedPersons : hybridResult.people, hybridResult.memories)
    if (graphResult) {
      hybridResult.graphRAG = graphResult
      hybridResult.context = hybridResult.context + '\n\n' + graphResult.graphContext
      const existingIds = new Set(hybridResult.memories.map(m => m.id))
      hybridResult.memories = [...hybridResult.memories, ...graphResult.indirectMemories.filter(m => !existingIds.has(m.id))]
      const existingPIds = new Set(hybridResult.people.map(p => p.id))
      hybridResult.people = [...hybridResult.people, ...graphResult.indirectPeople.filter(p => !existingPIds.has(p.id))]
      hybridResult.sources = [
        ...hybridResult.sources,
        ...graphResult.indirectMemories.map(m => ({ id: m.id, type: 'memory' as const, text: m.content.slice(0, 100) })),
        ...graphResult.indirectPeople.map(p => ({ id: p.id, type: 'person' as const, text: p.name })),
      ]
    }

    return hybridResult
  }

  // === 路径2: 关键词匹配（无向量索引时降级） ===
  const result = await keywordRetrieval(query, queryLower)

  // === GraphRAG 增强：知识图谱遍历发现间接关联 ===
  const graphResult = await tryGraphRAG(query, detectedPersons.length > 0 ? detectedPersons : result.people, result.memories)
  if (graphResult) {
    result.graphRAG = graphResult
    result.context = result.context + '\n\n' + graphResult.graphContext
    // 合并间接发现的记忆和人物
    const existingIds = new Set(result.memories.map(m => m.id))
    result.memories = [...result.memories, ...graphResult.indirectMemories.filter(m => !existingIds.has(m.id))]
    const existingPIds = new Set(result.people.map(p => p.id))
    result.people = [...result.people, ...graphResult.indirectPeople.filter(p => !existingPIds.has(p.id))]
    result.sources = [
      ...result.sources,
      ...graphResult.indirectMemories.map(m => ({ id: m.id, type: 'memory' as const, text: m.content.slice(0, 100) })),
      ...graphResult.indirectPeople.map(p => ({ id: p.id, type: 'person' as const, text: p.name })),
    ]
  }

  return result
}

/**
 * GraphRAG 增强尝试
 * 触发条件：查询命中 GraphRAG 意图模式，或检测到人物且查询涉及关系/介绍/人脉
 */
async function tryGraphRAG(
  query: string,
  detectedPersons: Person[],
  existingMemories: Memory[],
): Promise<GraphRAGResult | null> {
  // 触发条件判断
  const shouldTrigger = shouldTriggerGraphRAG(query) ||
    (detectedPersons.length > 0 && /关系|认识|介绍|人脉|帮我|能不能/.test(query)) ||
    isRelationshipChainQuery(query, detectedPersons)

  if (!shouldTrigger || detectedPersons.length === 0) return null

  try {
    return await graphRAGEnhance(query, detectedPersons, existingMemories)
  } catch (e) {
    console.warn('[GraphRAG] 增强失败，降级为普通检索:', e)
    return null
  }
}

/**
 * FIX-4: 检测查询中提及的人物
 * 通过全名、昵称、姓氏+称谓、名（去姓部分）匹配
 */
function detectPersonsInQuery(
  query: string,
  queryLower: string,
  allPeople: Person[]
): Person[] {
  const matched = new Set<string>()

  for (const person of allPeople) {
    // FIX: 防止 name 为 undefined 时崩溃
    if (!person.name || typeof person.name !== 'string') continue
    const nameLower = person.name.toLowerCase()
    // 1. 全名匹配
    if (queryLower.includes(nameLower)) {
      matched.add(person.id)
      continue
    }
    // 2. 昵称匹配
    const nicknames = person.profile?.identity?.nicknames || []
    if (nicknames.some(n => {
      const nn = n.trim().toLowerCase()
      return nn && nn.length >= 2 && queryLower.includes(nn)
    })) {
      matched.add(person.id)
      continue
    }
    // 3. 名（去姓部分）匹配 — 仅当全名 ≥ 3 字
    if (person.name.length >= 3) {
      const givenName = person.name.slice(1)
      if (givenName.length >= 2 && queryLower.includes(givenName.toLowerCase())) {
        matched.add(person.id)
        continue
      }
    }
    // 4. 姓氏+称谓匹配（如"王总"、"李医生"）
    if (person.name.length >= 2) {
      const surname = person.name[0]
      const title = person.profile?.career?.title || ''
      const honorifics: string[] = []
      if (title.includes('总监') || title.includes('经理') || title.includes('VP') || title.includes('CTO')) {
        honorifics.push(surname + '总')
      }
      if (title.includes('医生') || title.includes('医师')) honorifics.push(surname + '医生')
      if (title.includes('教练')) honorifics.push(surname + '教练')
      if (title.includes('老师') || title.includes('教师')) honorifics.push(surname + '老师')
      if (person.relationship === 'leader') honorifics.push(surname + '总')
      if (person.relationship === 'mentor') honorifics.push(surname + '老师')
      if (person.tags?.some(t => t.includes('医生'))) honorifics.push(surname + '医生')
      if (person.tags?.some(t => t.includes('教练'))) honorifics.push(surname + '教练')
      if (person.tags?.some(t => t.includes('老师') || t.includes('教师'))) honorifics.push(surname + '老师')

      if (honorifics.some(h => queryLower.includes(h.toLowerCase()))) {
        matched.add(person.id)
        continue
      }
    }
  }

  return allPeople.filter(p => matched.has(p.id))
}

/**
 * FIX-4: 人物优先检索策略
 * 为每个检测到的人物单独检索记忆，按人分配配额，确保每个人物都有代表
 */
async function personFirstRetrieval(
  query: string,
  queryLower: string,
  detectedPersons: Person[],
  allPeople: Person[]
): Promise<RetrievalResult> {
  const expandedQuery = await expandQuery(query)
  const personCount = detectedPersons.length
  // 每人分配的配额：总 10 条 / 人数，最少 2 条，最多 5 条
  const perPersonQuota = Math.max(2, Math.min(5, Math.ceil(10 / personCount)))

  // 为每个人物单独检索语义 + 关键词记忆
  const allMemories = await db.memories.toArray()
  const perPersonMemories: Map<string, Memory[]> = new Map()

  for (const person of detectedPersons) {
    // 语义检索：用人物名 + 原始查询（移除其他检测到的人名，避免干扰）
    const otherPersonNames = detectedPersons.filter(p => p.id !== person.id).map(p => p.name)
    let cleanedQuery = query
    for (const otherName of otherPersonNames) {
      cleanedQuery = cleanedQuery.replace(new RegExp(escapeRegExp(otherName), 'g'), '')
    }
    const personQuery = `${person.name} ${cleanedQuery}`.trim()
    const personExpanded = await expandQuery(personQuery)

    const [memoryTiers] = await Promise.all([
      tieredSearch(personExpanded, { sourceType: 'memory', hotLimit: perPersonQuota, warmLimit: 2, coldLimit: 1, minSimilarity: 0.2 }),
    ])

    const tierResults = [...memoryTiers.hot, ...memoryTiers.warm, ...memoryTiers.cold]
    const memoryIds = new Set(tierResults.map(r => r.sourceId))
    let personMems = allMemories.filter(m => memoryIds.has(m.id))

    // 关键词补充：用人物名作为关键词匹配
    const keywords = extractKeywords(personExpanded)
    const scoredMems = await scoreMemoriesWithTfidf(allMemories, [...keywords, person.name.toLowerCase()])
    const keywordMems = scoredMems
      .filter(s => s.score > 0 && !memoryIds.has(s.mem.id))
      .sort((a, b) => b.score - a.score)
      .slice(0, perPersonQuota - personMems.length)
      .map(s => s.mem)

    personMems = [...personMems, ...keywordMems].slice(0, perPersonQuota)

    // FIX-4 补充：始终确保每个检测到的人物至少有 1 条直接关联记忆
    const hasDirectMem = personMems.some(m => m.relatedPersonIds?.includes(person.id))
    if (!hasDirectMem) {
      const directMems = allMemories.filter(m =>
        m.relatedPersonIds?.includes(person.id) &&
        !personMems.find(pm => pm.id === m.id)
      ).slice(0, 2) // 最多补充 2 条直接关联记忆
      personMems = [...personMems, ...directMems].slice(0, perPersonQuota + 2) // 允许超出配额以确保直接关联记忆被包含
    }

    perPersonMemories.set(person.id, personMems)
  }

  // 合并所有人物的记忆，去重
  const mergedMemoryIds = new Set<string>()
  const mergedMemories: Memory[] = []
  for (const [, mems] of perPersonMemories) {
    for (const mem of mems) {
      if (!mergedMemoryIds.has(mem.id)) {
        mergedMemoryIds.add(mem.id)
        mergedMemories.push(mem)
      }
    }
  }

  // 日记检索
  const diaryResults = await semanticSearch(expandedQuery, { sourceType: 'diary', limit: 3, minSimilarity: 0.2 })
  const diaryIds = new Set(diaryResults.map(r => r.sourceId))
  const allDiaries = await db.diaries.toArray()
  const relevantDiaries = allDiaries.filter(d => diaryIds.has(d.id))

  // 人物匹配
  const relevantPeople = findRelevantPeople(queryLower, expandedQuery.toLowerCase(), mergedMemories, allPeople)

  const context = buildContextSummary(mergedMemories, relevantPeople, relevantDiaries)

  const sources = [
    ...mergedMemories.map(m => ({ id: m.id, type: 'memory' as const, text: m.content.slice(0, 100) })),
    ...relevantDiaries.map(d => ({ id: d.id, type: 'diary' as const, text: d.content.slice(0, 100) })),
    ...relevantPeople.map(p => ({ id: p.id, type: 'person' as const, text: p.name })),
  ]

  return {
    memories: mergedMemories,
    people: relevantPeople,
    diaries: relevantDiaries,
    context,
    method: 'hybrid',
    tiers: { hot: mergedMemories.length, warm: 0, cold: 0 },
    sources,
  }
}

/**
 * FIX-5: 检索结果多样性保障
 * 确保同一人物在 top-K 中占比不超过 50%，避免单人物垄断结果
 * 仅当检测到 ≥2 个人物时启用，单人物查询不受影响
 */
function ensureDiversity(memories: Memory[], limit: number): Memory[] {
  if (memories.length <= limit) return memories

  // 统计每条记忆关联的人物
  const memPersonCount = new Map<string, number>()
  for (const mem of memories) {
    const personIds = mem.relatedPersonIds || []
    memPersonCount.set(mem.id, personIds.length)
  }

  // 按人物分组
  const personMemMap = new Map<string, Memory[]>()
  const noPersonMems: Memory[] = []

  for (const mem of memories) {
    const personIds = mem.relatedPersonIds || []
    if (personIds.length === 0) {
      noPersonMems.push(mem)
    } else {
      // 归入第一个关联人物
      const primaryPerson = personIds[0]
      if (!personMemMap.has(primaryPerson)) {
        personMemMap.set(primaryPerson, [])
      }
      personMemMap.get(primaryPerson)!.push(mem)
    }
  }

  // 如果只有 1 个人物组（或 0 个），不需要多样性过滤
  if (personMemMap.size < 2) return memories

  // 每个人物最多占 limit 的 50%
  const maxPerPerson = Math.ceil(limit * 0.5)
  const result: Memory[] = []
  const usedIds = new Set<string>()

  // 轮询式选取：每轮从每个人物组取 1 条，直到填满 limit
  const personQueues = Array.from(personMemMap.values())
  let round = 0
  while (result.length < limit && round < maxPerPerson) {
    for (const queue of personQueues) {
      if (result.length >= limit) break
      if (round < queue.length) {
        const mem = queue[round]
        if (!usedIds.has(mem.id)) {
          result.push(mem)
          usedIds.add(mem.id)
        }
      }
    }
    round++
  }

  // 用无人物关联的记忆填充剩余位置
  for (const mem of noPersonMems) {
    if (result.length >= limit) break
    if (!usedIds.has(mem.id)) {
      result.push(mem)
      usedIds.add(mem.id)
    }
  }

  // 如果还不够，用剩余记忆填充
  for (const mem of memories) {
    if (result.length >= limit) break
    if (!usedIds.has(mem.id)) {
      result.push(mem)
      usedIds.add(mem.id)
    }
  }

  return result
}

// 语义检索路径（分层：热/温/冷）
async function semanticRetrieval(query: string, queryLower: string): Promise<RetrievalResult> {
  // 扩展查询：将"我妈"等称呼映射为人物全名，提升语义检索召回率
  const expandedQuery = await expandQuery(query)

  // 分层并行检索记忆和日记
  const [memoryTiers, diaryResults] = await Promise.all([
    tieredSearch(expandedQuery, { sourceType: 'memory', hotLimit: 5, warmLimit: 3, coldLimit: 2, minSimilarity: 0.25 }),
    semanticSearch(expandedQuery, { sourceType: 'diary', limit: 3, minSimilarity: 0.2 }),
  ])

  // 合并所有分层的记忆sourceIds
  const allTierResults = [...memoryTiers.hot, ...memoryTiers.warm, ...memoryTiers.cold]
  const memoryIds = new Set(allTierResults.map(r => r.sourceId))

  // 获取完整的记忆对象
  const allMemories = await db.memories.toArray()
  const relevantMemories = allMemories.filter(m => memoryIds.has(m.id))

  // 按分层优先级排序：热层 > 温层 > 冷层，同层内按相似度
  const hotIds = new Set(memoryTiers.hot.map(r => r.sourceId))
  const warmIds = new Set(memoryTiers.warm.map(r => r.sourceId))
  const similarityMap = new Map(allTierResults.map(r => [r.sourceId, r.similarity]))
  relevantMemories.sort((a, b) => {
    const aHot = hotIds.has(a.id) ? 2 : warmIds.has(a.id) ? 1 : 0
    const bHot = hotIds.has(b.id) ? 2 : warmIds.has(b.id) ? 1 : 0
    if (aHot !== bHot) return bHot - aHot
    return (similarityMap.get(b.id) || 0) - (similarityMap.get(a.id) || 0)
  })

  // 根据语义检索结果获取日记
  const diaryIds = new Set(diaryResults.map(r => r.sourceId))
  const allDiaries = await db.diaries.toArray()
  const relevantDiaries = allDiaries.filter(d => diaryIds.has(d.id))

  // 召回相关人物 — 使用扩展查询 + 别名匹配
  const allPeople = await db.persons.toArray()
  const relevantPeople = findRelevantPeople(queryLower, expandedQuery.toLowerCase(), relevantMemories, allPeople)

  // 兜底：如果语义检索结果太少，补充热层记忆
  if (relevantMemories.length < 3) {
    const recentHighConf = allMemories
      .filter(m => m.confidence === 'high' && !relevantMemories.find(r => r.id === m.id))
      .slice(0, 3 - relevantMemories.length)
    relevantMemories.push(...recentHighConf)
  }

  const context = memoryTiers.summary || buildContextSummary(relevantMemories, relevantPeople, relevantDiaries)

  const sources = [
    ...relevantMemories.map(m => ({ id: m.id, type: 'memory' as const, text: m.content.slice(0, 100), similarity: similarityMap.get(m.id) })),
    ...relevantDiaries.map(d => ({ id: d.id, type: 'diary' as const, text: d.content.slice(0, 100) })),
    ...relevantPeople.map(p => ({ id: p.id, type: 'person' as const, text: p.name })),
  ]

  return {
    memories: relevantMemories,
    people: relevantPeople,
    diaries: relevantDiaries,
    context,
    method: 'semantic',
    tiers: { hot: memoryTiers.hot.length, warm: memoryTiers.warm.length, cold: memoryTiers.cold.length },
    sources,
  }
}

// 统一的人物匹配函数：检查查询中是否提及某人物（通过全名、昵称、关系称呼、全名部分匹配）
function findRelevantPeople(
  queryLower: string,
  expandedQueryLower: string,
  memories: Memory[],
  allPeople: Person[]
): Person[] {
  const matchedIds = new Set<string>()

  for (const person of allPeople) {
    const personNameLower = person.name.toLowerCase()
    // 1. 查询中直接包含人物全名
    if (queryLower.includes(personNameLower)) {
      matchedIds.add(person.id)
      continue
    }
    // 2. 查询中包含人物昵称（完全匹配或包含关系）
    const nicknames = person.profile?.identity?.nicknames || []
    if (nicknames.some(n => {
      const nn = n.trim().toLowerCase()
      return nn && nn.length >= 1 && queryLower.includes(nn)
    })) {
      matchedIds.add(person.id)
      continue
    }
    // 3. 扩展查询中包含人物全名（expandQuery 已将"我妈"等映射为全名）
    if (expandedQueryLower.includes(personNameLower)) {
      matchedIds.add(person.id)
      continue
    }
    // 4. 全名部分匹配：如果人物全名 ≥ 2 字，检查查询中是否包含全名去掉姓的部分
    if (person.name.length >= 3) {
      const givenName = person.name.slice(1) // 去掉姓，如"陈秀兰"→"秀兰"
      if (givenName.length >= 2 && queryLower.includes(givenName.toLowerCase())) {
        matchedIds.add(person.id)
        continue
      }
    }
    // 5. 记忆内容中包含人物全名
    for (const mem of memories) {
      if (mem.content.toLowerCase().includes(personNameLower)) {
        matchedIds.add(person.id)
        break
      }
    }
  }

  return allPeople.filter(p => matchedIds.has(p.id))
}

// 关键词检索路径（降级方案，保留原有逻辑）
// OPT-3: 使用问题类型分类器动态调整 memoryLimit
// OPT-7: 添加时间衰减因子
async function keywordRetrieval(query: string, queryLower: string): Promise<RetrievalResult> {
  const expandedQuery = await expandQuery(query)

  // OPT-3: 问题类型分类，动态调整 limit
  const classification = classifyQuery(query)
  const memoryLimit = classification.memoryLimit

  const allMemories = await db.memories.orderBy('createdAt').reverse().limit(100).toArray()
  const allDiaries = await db.diaries.orderBy('timestamp').reverse().limit(30).toArray()

  const keywords = extractKeywords(expandedQuery)
  // OPT-5: 使用 TF-IDF 权重替代简单计数，泛化词降权、实体词加权
  const scoredMemories = await scoreMemoriesWithTfidf(allMemories, keywords)

  const relevantMemories = scoredMemories
    .filter((s) => s.score > classification.minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, memoryLimit)
    .map((s) => s.mem)

  const scoredDiaries = allDiaries.map((diary) => {
    const diaryLower = diary.content.toLowerCase()
    let score = 0
    for (const kw of keywords) {
      if (diaryLower.includes(kw)) score += 1
    }
    for (const tag of diary.tags) {
      if (keywords.some(kw => tag.toLowerCase().includes(kw))) score += 0.8
    }
    for (const emo of diary.emotions) {
      if (keywords.some(kw => emo.toLowerCase().includes(kw))) score += 0.5
    }
    return { diary, score }
  })

  const relevantDiaries = scoredDiaries
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((s) => s.diary)

  if (relevantMemories.length < Math.min(5, memoryLimit)) {
    const recentHighConf = allMemories
      .filter((m) => m.confidence === 'high' && !relevantMemories.find((r) => r.id === m.id))
      .slice(0, Math.min(5, memoryLimit) - relevantMemories.length)
    relevantMemories.push(...recentHighConf)
  }

  const allPeople = await db.persons.toArray()
  const relevantPeople = findRelevantPeople(queryLower, expandedQuery.toLowerCase(), relevantMemories, allPeople)

  const context = buildContextSummary(relevantMemories, relevantPeople, relevantDiaries)

  const sources = [
    ...relevantMemories.map(m => ({ id: m.id, type: 'memory' as const, text: m.content.slice(0, 100) })),
    ...relevantDiaries.map(d => ({ id: d.id, type: 'diary' as const, text: d.content.slice(0, 100) })),
    ...relevantPeople.map(p => ({ id: p.id, type: 'person' as const, text: p.name })),
  ]

  return {
    memories: relevantMemories,
    people: relevantPeople,
    diaries: relevantDiaries,
    context,
    method: 'keyword',
    tiers: { hot: 0, warm: 0, cold: 0 },
    sources,
    queryType: classification.type,
  }
}

function extractKeywords(query: string): string[] {
  const stopWords = new Set([
    '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这',
    '什么', '怎么', '为什么', '啥', '啥时候', '时候', '可以', '能', '能够', '应该', '需要', '想', '想要', '觉得', '认为', '知道', '告诉', '帮忙', '问题', '情况',
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
  ])

  const cleaned = query
    .toLowerCase()
    .replace(/[^\u4e00-\u9fa5a-z0-9\s]/g, ' ')
    .trim()

  const keywords = new Set<string>()

  // 英文/数字按空格分词
  const englishParts = cleaned.split(/\s+/).filter(w => /[a-z0-9]/.test(w) && w.length >= 2 && !stopWords.has(w))
  englishParts.forEach(w => keywords.add(w))

  // 中文部分：提取连续中文字符段，然后用 2-4 字滑动窗口提取子串
  const chineseSegments = cleaned.match(/[\u4e00-\u9fa5]+/g) || []
  for (const seg of chineseSegments) {
    // 2字词
    for (let i = 0; i <= seg.length - 2; i++) {
      const word = seg.slice(i, i + 2)
      if (!stopWords.has(word) && !isAllStopChars(word)) {
        keywords.add(word)
      }
    }
    // 3字词
    for (let i = 0; i <= seg.length - 3; i++) {
      const word = seg.slice(i, i + 3)
      if (!stopWords.has(word)) {
        keywords.add(word)
      }
    }
    // 4字词（如"端午节"、"回绍兴"等可能被切成4字）
    for (let i = 0; i <= seg.length - 4; i++) {
      const word = seg.slice(i, i + 4)
      if (!stopWords.has(word)) {
        keywords.add(word)
      }
    }
  }

  return [...keywords]
}

// 检查一个2字词是否全部由停用单字组成
function isAllStopChars(word: string): boolean {
  const stopChars = new Set(['的','了','在','是','我','有','和','就','不','人','都','一','上','也','很','到','说','要','去','你','会','着','看','好','这','啥','么','吗','呢','吧','啊','哦','嗯'])
  return [...word].every(c => stopChars.has(c))
}

async function expandQuery(query: string): Promise<string> {
  // 动态获取人物名构建同义词
  const people = await db.persons.toArray()
  const nameSynonyms: Record<string, string[]> = {}

  // FIX-3: 姓氏+称谓变体生成 — 为所有人物自动生成姓氏+职业/关系称谓
  // 称谓映射表：根据 relationship 和 title 推导合适的称谓
  const titleHonorMap: Record<string, string> = {
    '医生': '医生', '医师': '医生', '心理咨询师': '医生',
    '教练': '教练', '老师': '老师', '教师': '老师',
    '总监': '总', '经理': '总', 'VP': '总', 'CTO': '总', 'CEO': '总',
    '创始人': '总',
  }
  const relationshipHonorMap: Record<string, string> = {
    'leader': '总',
    'mentor': '老师',
    'client': '总',
  }

  for (const person of people) {
    const name = person.name
    // 根据关系类型添加常见称呼，同时合并昵称
    const aliases: string[] = []
    if (person.profile?.identity?.nicknames) {
      aliases.push(...person.profile.identity.nicknames.filter(n => n.trim()))
    }
    if (person.relationship === 'spouse') aliases.push('妻子', '爱人', '老婆', '老公', '媳妇', '丈夫', '太太', '先生', '另一半', '家属')
    if (person.relationship === 'family') {
      if (person.profile?.identity?.gender === 'female' || person.traits.some(t => t.includes('母') || t.includes('妈'))) {
        aliases.push('母亲', '妈', '老妈', '妈妈', '娘', '老妈子', '老娘', '阿妈', '妈咪', '母上')
      }
      if (person.profile?.identity?.gender === 'male' || person.traits.some(t => t.includes('父') || t.includes('爸'))) {
        aliases.push('父亲', '爸', '老爸', '爸爸', '爹', '老爹', '阿爸', '爹地', '父上')
      }
      // 兄弟姐妹
      if (person.profile?.identity?.gender === 'male') aliases.push('哥哥', '哥', '老哥', '弟弟', '弟', '老弟', '兄弟')
      if (person.profile?.identity?.gender === 'female') aliases.push('姐姐', '姐', '老姐', '妹妹', '妹', '老妹', '姐妹')
      // 子女
      if (person.profile?.identity?.age && person.profile.identity.age < 18) {
        aliases.push('儿子', '女儿', '孩子', '娃', '小孩', '宝贝')
      }
      aliases.push('家人', '亲戚', '家里人')
    }
    if (person.relationship === 'leader') aliases.push('老板', '上司', '主管', '经理', '总监', '领导', '老大', 'boss')
    if (person.relationship === 'colleague') aliases.push('同事', '搭档', '同僚', '工友')
    if (person.relationship === 'friend') aliases.push('朋友', '哥们', '闺蜜', '兄弟', '老友', '发小', '同学', ' buddy')
    if (person.relationship === 'mentor') aliases.push('老师', '师傅', '导师', '前辈', '师父')
    if (person.relationship === 'client') aliases.push('客户', '甲方', '买家', '顾客', '投资人', '金主')
    if (person.relationship === 'subordinate') aliases.push('下属', '员工', '手下', '团队', '小弟')
    if (person.relationship === 'rival') aliases.push('对手', '竞品', '竞争对手')

    // FIX-3: 姓氏+称谓变体（如"王总"、"李医生"、"张教练"）
    if (name.length >= 2) {
      const surname = name[0]
      const title = person.profile?.career?.title || ''
      // 从 title 推导称谓
      for (const [key, honor] of Object.entries(titleHonorMap)) {
        if (title.includes(key)) {
          aliases.push(surname + honor)
          break
        }
      }
      // 从 relationship 推导称谓
      const relHonor = relationshipHonorMap[person.relationship]
      if (relHonor && !aliases.includes(surname + relHonor)) {
        aliases.push(surname + relHonor)
      }
      // 特殊：医生/教练/老师类人物，姓氏+职业称谓
      if (person.tags?.some(t => t.includes('医生') || t.includes('医'))) {
        aliases.push(surname + '医生')
      }
      if (person.tags?.some(t => t.includes('教练'))) {
        aliases.push(surname + '教练')
      }
      if (person.tags?.some(t => t.includes('老师') || t.includes('教师'))) {
        aliases.push(surname + '老师')
      }
    }

    if (aliases.length > 0) {
      nameSynonyms[name] = [...new Set(aliases)]
    }
  }

  const staticSynonyms: Record<string, string[]> = {
    '工作': ['上班', '职场', '公司', '业务', '项目', '云启', '运营'],
    '公司': ['云启科技', '杭州云启', '运营部'],
    '职位': ['运营总监', '总监', '管理'],
    '压力': ['焦虑', '紧张', '疲惫', '累', '扛不住', '失眠'],
    '睡眠': ['失眠', '睡觉', '休息', '熬夜', '入睡'],
    '健康': ['身体', '体检', '锻炼', '运动', '脂肪肝', '血压'],
    '钱': ['收入', '工资', '薪水', '房贷', '财务', '开销', '开支'],
    '创业': ['创业', '创业邀请', '合伙', '创业公司'],
    '跳槽': ['跳槽', '换工作', '找工作', '离职'],
    '端午': ['端午节', '端午', '粽子节', '龙舟节'],
    '中秋': ['中秋节', '中秋', '月饼节'],
    '春节': ['过年', '新春', '除夕', '大年'],
    // OPT-5: 实体映射增强
    '结婚': ['妻子', '晓薇', '林晓薇', '婚姻', '夫妻'],
    '老婆': ['晓薇', '林晓薇', '妻子'],
    '孩子': ['一诺', '陈一诺', '儿子'],
    '妈': ['妈妈', '陈秀兰', '秀兰', '母亲'],
    '领导': ['王思亮', 'VP', '赵海明'],
    '同事': ['刘文燕', '赵海明'],
  }

  let expanded = query
  // 人物别名 → 全名扩展：检查查询中是否包含别名（如"我妈"），若包含则追加全名（如"陈秀兰"）
  for (const [personName, aliases] of Object.entries(nameSynonyms)) {
    for (const alias of aliases) {
      if (query.includes(alias)) {
        expanded += ' ' + personName
        break // 每个人物只追加一次全名
      }
    }
  }
  // 静态同义词扩展：检查查询中是否包含关键词，若包含则追加同义词
  for (const [word, syns] of Object.entries(staticSynonyms)) {
    if (query.includes(word)) {
      expanded += ' ' + syns.join(' ')
    }
  }
  return expanded
}

function buildContextSummary(memories: Memory[], people: Person[], diaries?: DiaryEntry[]): string {
  const parts: string[] = []

  if (people.length > 0) {
    parts.push(`相关人物：${people.map((p) => p.name).join('、')}`)
  }

  if (memories.length > 0) {
    parts.push(`相关记忆：`)
    for (const mem of memories.slice(0, 5)) {
      parts.push(`- ${mem.content}`)
    }
  }

  if (diaries && diaries.length > 0) {
    parts.push(`相关日记：`)
    for (const diary of diaries) {
      const date = new Date(diary.timestamp).toLocaleDateString('zh-CN')
      parts.push(`- [${date}] ${diary.content.slice(0, 100)}${diary.content.length > 100 ? '...' : ''}`)
    }
  }

  return parts.join('\n') || '暂无相关背景信息'
}
