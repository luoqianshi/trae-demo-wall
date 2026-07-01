/**
 * TF-IDF 权重计算
 * 对关键词匹配结果按 TF-IDF 分数排序
 * 泛化词（如"公司""工作"）降权，实体词（人名、数字）加权
 * FIX-2: 人名实体识别与加权 — 从 DB 加载人名词典，2字人名也加权 ×3.0
 */

import { db } from './db'

// 缓存 IDF 值，避免每次查询都重新计算
let idfCache: Map<string, number> | null = null
let idfCacheTime = 0
const IDF_CACHE_TTL = 60000 // 1 分钟缓存

// FIX-2: 人名词典缓存 — 从 DB 加载所有人名、昵称、名（去姓部分）
let personNameSet: Set<string> | null = null
let personNameCacheTime = 0
const PERSON_NAME_CACHE_TTL = 60000 // 1 分钟缓存

/**
 * FIX-2: 加载人名词典
 * 收集所有人名全名、昵称、名（去姓部分），用于实体识别
 */
async function loadPersonNameDictionary(): Promise<Set<string>> {
  if (personNameSet && Date.now() - personNameCacheTime < PERSON_NAME_CACHE_TTL) {
    return personNameSet
  }

  const persons = await db.persons.toArray()
  const names = new Set<string>()

  for (const person of persons) {
    // 全名（如"王博"、"陈秀兰"）
    if (person.name && person.name.length >= 2) {
      names.add(person.name.toLowerCase())
    }
    // 昵称
    const nicknames = person.profile?.identity?.nicknames || []
    for (const nick of nicknames) {
      if (nick && nick.trim().length >= 2) {
        names.add(nick.trim().toLowerCase())
      }
    }
    // 名（去姓部分，如"秀兰"、"一诺"）— 仅当全名 ≥ 3 字时
    if (person.name && person.name.length >= 3) {
      const givenName = person.name.slice(1)
      if (givenName.length >= 2) {
        names.add(givenName.toLowerCase())
      }
    }
  }

  personNameSet = names
  personNameCacheTime = Date.now()
  return names
}

/** FIX-2: 检查关键词是否是人名 */
async function isPersonName(kw: string): Promise<boolean> {
  const dict = await loadPersonNameDictionary()
  return dict.has(kw.toLowerCase())
}

/** 清除人名词典缓存（新人物入库后调用） */
export function clearPersonNameCache() {
  personNameSet = null
  personNameCacheTime = 0
}

// 高频泛化词黑名单（IDF 极低，直接降权）
const GENERIC_WORDS = new Set([
  '公司', '工作', '职位', '事情', '问题', '时候', '地方',
  '感觉', '觉得', '可能', '应该', '关系', '影响',
  '家庭', '身体', '时间', '最近', '之前', '以后',
  '什么', '怎么', '为什么', '可以', '需要', '想要',
])

export async function computeIdf(): Promise<Map<string, number>> {
  if (idfCache && Date.now() - idfCacheTime < IDF_CACHE_TTL) return idfCache

  const allMemories = await db.memories.toArray()
  const N = allMemories.length || 1
  const docFreq = new Map<string, number>()

  for (const mem of allMemories) {
    const memLower = mem.content.toLowerCase()
    const seen = new Set<string>()
    // 提取 2-4 字滑动窗口
    const segs = memLower.match(/[\u4e00-\u9fa5]+/g) || []
    for (const seg of segs) {
      for (let i = 0; i <= seg.length - 2; i++) {
        const word = seg.slice(i, i + 2)
        if (!seen.has(word)) {
          seen.add(word)
          docFreq.set(word, (docFreq.get(word) || 0) + 1)
        }
      }
    }
  }

  const idf = new Map<string, number>()
  for (const [word, df] of docFreq) {
    const idfValue = Math.log(N / (df + 1)) + 1
    idf.set(word, idfValue)
  }

  idfCache = idf
  idfCacheTime = Date.now()
  return idf
}

/**
 * 使用 TF-IDF 权重对记忆评分
 * 替代 keywordRetrieval 中的简单 score += 1
 * FIX-2: 人名实体加权从 length>=3 改为词典匹配，权重提升至 ×3.0
 */
export async function scoreMemoriesWithTfidf(
  memories: Array<{ content: string; confidence?: string; confirmed?: boolean; createdAt?: number; [key: string]: any }>,
  keywords: string[]
): Promise<Array<{ mem: any; score: number }>> {
  const idf = await computeIdf()
  // FIX-2: 预加载人名词典，避免每条记忆都异步查询
  const personDict = await loadPersonNameDictionary()

  return memories.map((mem) => {
    const memLower = mem.content.toLowerCase()
    let score = 0

    for (const kw of keywords) {
      if (memLower.includes(kw)) {
        let kwScore = idf.get(kw) || 1

        // 泛化词降权
        if (GENERIC_WORDS.has(kw)) kwScore *= 0.3

        // FIX-2: 人名实体加权（×3.0）— 使用词典匹配，2字人名也能命中
        if (personDict.has(kw.toLowerCase())) {
          kwScore *= 3.0
        }
        // 数字实体加权（日期、金额等）
        else if (/\d/.test(kw)) {
          kwScore *= 2.0
        }
        // 3字以上非泛化词加权
        else if (kw.length >= 3 && !GENERIC_WORDS.has(kw)) {
          kwScore *= 2.0
        }

        score += kwScore
      }
    }

    // 置信度和确认状态加权
    if (mem.confidence === 'high') score += 0.5
    if (mem.confirmed) score += 0.3

    // 时间衰减：30天内不衰减，90天内衰减20%，更早的衰减50%
    if (mem.createdAt) {
      const ageDays = (Date.now() - mem.createdAt) / 86400000
      if (ageDays < 30) score *= 1.0
      else if (ageDays < 90) score *= 0.8
      else score *= 0.5
    }

    return { mem, score }
  })
}

/** 清除 IDF 缓存（新记忆入库后调用） */
export function clearIdfCache() {
  idfCache = null
  idfCacheTime = 0
  // FIX-2: 同时清除人名词典缓存
  clearPersonNameCache()
}
