// 记忆自动提取管道 v2
// 借鉴 Mem0 理念：智能合并 + 时序感知 + 重要性评分

import { chat, getEmbedding } from './ai'
import { buildMemoryExtractionPrompt } from './prompts'
import { validateExtractedMemory } from './memorySchema'
import { reportError } from './errorReporter'
import { db } from './db'
import { cosineSimilarity } from './vectorStore'
import { getUserProfileObject } from './prompts'
import {
  personRepository,
  memoryRepository,
} from '../repositories'
import { dataSyncService } from '../services'
import type { Memory, Person } from '../types'

// FIX: 转义正则特殊字符，防止用户名含 (.) (*) (+) 等导致 RegExp 崩溃
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// 将记忆内容中的"用户"和用户姓名替换为第二人称"你"
function sanitizeMemoryContent(content: string): string {
  let result = content.replace(/用户/g, '你')
  const profile = getUserProfileObject()
  const userName = profile.name?.trim()
  if (userName && userName.length >= 2) {
    result = result.replace(new RegExp(escapeRegExp(userName), 'g'), '你')
    if (userName.length >= 3) {
      const givenName = userName.slice(1)
      if (givenName.length >= 2) {
        result = result.replace(new RegExp(escapeRegExp(givenName), 'g'), '你')
      }
    }
  }
  return result
}

export interface ExtractedMemory {
  type: 'preference' | 'commitment' | 'event' | 'insight' | 'emotion' | 'habit' | 'goal' | 'fear' | 'value'
  content: string
  confidence: 'high' | 'medium' | 'low'
  reason: string
  related_dimensions?: string[]
  related_person_names?: string[]
  temporal?: 'current' | 'past' | 'future'
  importance?: 'high' | 'medium' | 'low'
}

interface ExtractedEntity {
  text: string
  type: 'person' | 'organization' | 'location' | 'time' | 'event' | 'concept'
}

interface ExtractionResult {
  memories: ExtractedMemory[]
  people_mentioned: string[]
  topics: string[]
  emotions: string[]
  cross_dimension_impact?: string
  entities?: ExtractedEntity[]
}

function extractJsonBlock(text: string): string | null {
  const objectMatch = text.match(/\{[\s\S]*\}/)
  if (objectMatch) return objectMatch[0]
  const arrayMatch = text.match(/\[[\s\S]*\]/)
  if (arrayMatch) return arrayMatch[0]
  return null
}

/**
 * 修复常见的 LLM JSON 输出问题
 * 1. 中文标点 → 英文标点（，→,  ：→:  ""→""  ''→''）
 * 2. 尾逗号（trailing comma）移除
 * 3. 截断 JSON 尝试补全括号
 * 4. 单引号 → 双引号
 */
function fixCommonJsonIssues(text: string): string {
  let result = text

  // 1. 中文标点替换为英文标点
  result = result
    .replace(/，/g, ',')
    .replace(/：/g, ':')
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/【/g, '[')
    .replace(/】/g, ']')
    .replace(/｛/g, '{')
    .replace(/｝/g, '}')

  // 2. 移除尾逗号（,] 或 ,} 前的逗号）
  result = result.replace(/,(\s*[}\]])/g, '$1')

  // 3. 移除多余的控制字符
  result = result.replace(/[\x00-\x1f\x7f]/g, (ch) => {
    // 保留换行、制表符、回车
    if (ch === '\n' || ch === '\t' || ch === '\r') return ch
    return ''
  })

  return result
}

/**
 * 尝试修复截断的 JSON（LLM 因 maxTokens 限制输出不完整）
 * 使用栈结构按正确逆序补全缺失的引号、括号、大括号
 */
function tryFixTruncatedJson(text: string): string | null {
  let result = text.trim()

  // 检查是否是截断的 JSON（以 { 或 [ 开头但不完整）
  if (!result.startsWith('{') && !result.startsWith('[')) return null

  // 用栈追踪未闭合的括号/大括号，按正确逆序关闭
  const stack: ('{' | '[')[] = []
  let inString = false
  let escape = false

  for (let i = 0; i < result.length; i++) {
    const ch = result[i]
    if (escape) {
      escape = false
      continue
    }
    if (ch === '\\') {
      escape = true
      continue
    }
    if (ch === '"') {
      inString = !inString
      continue
    }
    if (inString) continue
    if (ch === '{' || ch === '[') {
      stack.push(ch)
    } else if (ch === '}' || ch === ']') {
      stack.pop()
    }
  }

  // 如果在字符串内被截断，先关闭字符串
  if (inString) {
    result += '"'
  }

  // 移除可能的尾逗号
  result = result.replace(/,(\s*)$/, '$1')

  // 按栈逆序补全闭合括号
  for (let i = stack.length - 1; i >= 0; i--) {
    result += stack[i] === '{' ? '}' : ']'
  }

  return result
}

function repairAndParseJson<T>(text: string): T | null {
  // Step 1: 去除 markdown 代码块标记
  const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

  // Step 2: 直接尝试解析
  try {
    return JSON.parse(clean) as T
  } catch {
    // continue to more aggressive repair
  }

  // Step 3: 修复中文标点、尾逗号等常见问题后重试
  const fixed = fixCommonJsonIssues(clean)
  try {
    return JSON.parse(fixed) as T
  } catch {
    // continue
  }

  // Step 4: 提取 JSON 块后重试
  const block = extractJsonBlock(fixed)
  if (block) {
    try {
      return JSON.parse(block) as T
    } catch {
      // continue
    }
  }

  // Step 5: 尝试修复截断的 JSON
  const truncatedFix = tryFixTruncatedJson(block || fixed)
  if (truncatedFix) {
    try {
      return JSON.parse(truncatedFix) as T
    } catch {
      // give up
    }
  }

  return null
}

function sanitizeExtractionResult(value: unknown): ExtractionResult | null {
  if (!value || typeof value !== 'object') return null
  const result = value as Partial<ExtractionResult>
  if (!Array.isArray(result.memories)) return null
  const validMemories = result.memories
    .map((mem) => validateExtractedMemory(mem))
    .filter((m): m is ExtractedMemory => m !== null)
  return {
    memories: validMemories,
    people_mentioned: Array.isArray(result.people_mentioned) ? result.people_mentioned : [],
    topics: Array.isArray(result.topics) ? result.topics : [],
    emotions: Array.isArray(result.emotions) ? result.emotions : [],
    cross_dimension_impact: typeof result.cross_dimension_impact === 'string' ? result.cross_dimension_impact : undefined,
    entities: Array.isArray(result.entities) ? result.entities : [],
  }
}

async function retryExtraction(
  userMessage: string,
  assistantReply: string,
  brokenResponse: string
): Promise<ExtractionResult | null> {
  try {
    const response = await chat(
      [
        {
          role: 'user',
          content: `原始对话：\n用户：${userMessage}\n衡舟：${assistantReply}\n\n损坏的 JSON 输出：\n${brokenResponse}\n\n请修复并只输出合法 JSON。`,
        },
      ],
      {
        system: '你是 JSON 修复专家。用户给了一段损坏的 JSON 输出，请只输出修复后的合法 JSON，不要任何解释。',
        preferDoubao: true,  // OPT-2: 重试也用豆包
        maxTokens: 1024,     // FIX: 同步提升至 1024
      }
    )
    const clean = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const result = repairAndParseJson<ExtractionResult>(clean)
    return sanitizeExtractionResult(result)
  } catch (e) {
    reportError('memory_extractor', e)
    return null
  }
}

export async function extractMemoriesFromConversation(
  userMessage: string,
  assistantReply: string
): Promise<ExtractionResult> {
  const prompt = buildMemoryExtractionPrompt(userMessage, assistantReply)

  try {
    const response = await chat(
      [{ role: 'user', content: prompt }],
      {
        system: '你是一个信息提取专家，只输出合法的 JSON。请额外添加 temporal（current/past/future）和 importance（high/medium/low）字段。',
        preferDoubao: true,  // OPT-2: 记忆提取用豆包，不占用 DeepSeek 主通道
        maxTokens: 1024,     // FIX: 512 过低导致 JSON 截断，提升至 1024
      }
    )

    const result = sanitizeExtractionResult(repairAndParseJson<ExtractionResult>(response))
    if (result) {
      return result
    }

    console.warn('[MemoryExtractor] 首次提取 JSON 不合法，尝试重试')
    const retryResult = await retryExtraction(userMessage, assistantReply, response)
    if (retryResult) return retryResult

    console.warn('[MemoryExtractor] 重试后仍无法解析，返回空结果')
    return { memories: [], people_mentioned: [], topics: [], emotions: [] }
  } catch (e) {
    reportError('memory_extractor', e)
    return { memories: [], people_mentioned: [], topics: [], emotions: [] }
  }
}

// 智能保存：合并相似记忆而非简单跳过
export async function saveExtractedMemories(
  extraction: ExtractionResult,
  source: string
): Promise<Memory[]> {
  const saved: Memory[] = []

  // 预加载人物表，用于名字→ID映射
  const allPeople = await personRepository.getAll()
  const nameToPersonMap = buildNameToPersonMap(allPeople)

  for (const mem of extraction.memories) {
    try {
      // 后处理：将"用户"和用户姓名替换为"你"
      const sanitizedContent = sanitizeMemoryContent(mem.content)

      // 解析关联人物名字为真实ID
      const relatedNames = [
        ...(mem.related_person_names || []),
        ...(extraction.people_mentioned || []),
      ]
      const relatedPersonIds = resolvePersonIds(relatedNames, nameToPersonMap)

      // 查找相似记忆
      const existing = await findSimilarMemory(sanitizedContent)

      if (existing) {
        // 智能合并：如果新记忆更详细或更新，更新现有记忆
        if (shouldUpdateMemory(existing, mem)) {
          // 更新前执行冲突检测：防止 AI 幻觉篡改已有事实（如日期）
          const allMemories = await memoryRepository.getAll()
          const conflict = await detectMemoryConflict(sanitizedContent, allMemories)

          if (conflict.hasConflict) {
            // 检测到冲突：不更新原记忆，改为新建待确认记忆
            console.warn(
              `[Memory] 更新路径检测到冲突（${conflict.reason}），保留原记忆，新建待确认：\n` +
                `  原记忆：${existing.content.slice(0, 50)}\n` +
                `  新记忆：${sanitizedContent.slice(0, 50)}`
            )
            const memory = await dataSyncService.saveMemory({
              type: mem.type,
              content: `[待确认] ${sanitizedContent}`,
              source,
              confidence: mem.confidence,
              confirmed: false,
              tags: [...(extraction.topics || []), ...(extraction.emotions || [])].slice(0, 5),
              relatedPersonIds,
              relatedMemoryIds: [],
            })
            saved.push(memory)
          } else {
            await dataSyncService.updateMemory(existing.id, {
              content: sanitizedContent,
              confidence: mem.confidence,
              type: mem.type,
            })
            console.log('[Memory] 更新记忆:', sanitizedContent.slice(0, 30))
            const updated = await memoryRepository.getById(existing.id)
            if (updated) saved.push(updated)
          }
        }
        // 否则跳过（已有更完整的信息）
      } else {
        // 新记忆：写入前执行冲突检测
        const allMemories = await memoryRepository.getAll()
        const conflict = await detectMemoryConflict(sanitizedContent, allMemories)

        let finalContent = sanitizedContent
        let confirmed = mem.confidence === 'high'

        if (conflict.hasConflict) {
          // 检测到冲突：标记为待确认，content 前加 [待确认] 前缀
          finalContent = `[待确认] ${sanitizedContent}`
          confirmed = false
          console.warn(
            `[Memory] 检测到冲突（${conflict.reason}）：\n` +
              `  新记忆：${sanitizedContent.slice(0, 50)}\n` +
              `  已有记忆：${conflict.conflictMemory?.content.slice(0, 50)}`
          )
        }

        const memory = await dataSyncService.saveMemory({
          type: mem.type,
          content: finalContent,
          source,
          confidence: mem.confidence,
          confirmed,
          tags: [...(extraction.topics || []), ...(extraction.emotions || [])].slice(0, 5),
          relatedPersonIds,
          relatedMemoryIds: [],
        })
        saved.push(memory)
      }
    } catch (err) {
      // FIX: 单条记忆处理失败不中断整个循环，继续处理后续记忆
      console.error('[MemoryExtractor] 单条记忆处理失败，跳过:', mem.content?.slice(0, 30), err)
    }
  }

  // 动态调整人物关系温度
  await adjustRelationshipSentiments(extraction, allPeople)

  console.log(`[MemoryExtractor] 已为 ${saved.length} 条记忆建立/更新`)
  return saved
}

// 查找相似记忆（前30字符 + embedding 语义相似度）
async function findSimilarMemory(content: string): Promise<Memory | undefined> {
  const prefix = content.slice(0, 30)
  const allMemories = await memoryRepository.getAll()

  const exact = allMemories.find((m) => m.content.includes(prefix))
  if (exact) return exact

  const queryEmbedding = await getEmbedding(content)
  if (queryEmbedding.length === 0) return undefined

  const candidates = allMemories
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 50)

  let bestMatch: Memory | undefined
  let bestScore = 0

  for (const mem of candidates) {
    const records = await db.embeddings.where({ sourceType: 'memory', sourceId: mem.id }).toArray()
    if (records.length === 0) continue
    const sim = cosineSimilarity(queryEmbedding, records[0].embedding)
    if (sim > bestScore && sim > 0.82) {
      bestScore = sim
      bestMatch = mem
    }
  }

  return bestMatch
}

// 判断是否应该更新现有记忆
function shouldUpdateMemory(existing: Memory, newMem: ExtractedMemory): boolean {
  // 保护：已确认的高置信度记忆不允许被自动覆盖（防止 AI 幻觉篡改已验证事实）
  if (existing.confirmed && existing.confidence === 'high') return false
  if (newMem.temporal === 'current' && Date.now() - existing.createdAt > 7 * 86400000) return true
  if (newMem.content.length > existing.content.length * 1.5) return true
  if (newMem.confidence === 'high' && existing.confidence !== 'high') return true
  return false
}

// 提取关键短语（2字滑动窗口，过滤停用词），用于主题相似性判断
function extractKeyPhrases(text: string): string[] {
  const stopChars = new Set([
    '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '上', '也',
    '很', '到', '说', '要', '去', '你', '会', '着', '看', '好', '这', '啥', '么', '吗',
    '呢', '吧', '啊', '哦', '嗯', '给', '让', '被', '把', '对', '跟', '与', '为', '以',
    '于', '及', '或', '但', '而', '且', '如', '因', '由', '从', '向', '往', '出', '入',
    '起', '过', '来', '下', '后', '前', '里', '外', '中', '间', '左', '右', '内', '旁',
  ])
  const phrases: string[] = []
  const chineseSegs = text.match(/[\u4e00-\u9fa5]+/g) || []
  for (const seg of chineseSegs) {
    for (let i = 0; i <= seg.length - 2; i++) {
      const phrase = seg.slice(i, i + 2)
      if (![...phrase].every((c) => stopChars.has(c))) {
        phrases.push(phrase)
      }
    }
  }
  return [...new Set(phrases)]
}

// 记忆冲突检测结果
interface ConflictResult {
  hasConflict: boolean
  conflictMemory?: Memory
  reason?: string
}

// 记忆冲突检测：日期冲突 / 事实矛盾 / 人物信息冲突
// 仅在"新记忆"路径调用，不影响已有记忆的合并逻辑
async function detectMemoryConflict(
  newContent: string,
  existingMemories: Memory[]
): Promise<ConflictResult> {
  // 提取新记忆中的日期与生日信息
  const dateMatch = newContent.match(/(\d{1,2})月(\d{1,2})日?/)
  const birthdayMatch = newContent.match(/生日是(.{2,20})/)

  const newKeywords = extractKeyPhrases(newContent)

  // === 规则 1 & 3：日期冲突、生日冲突、人物信息冲突 ===
  // 遍历所有记忆，纯字符串匹配，性能开销小
  for (const mem of existingMemories) {
    // 跳过已标记为待确认的记忆，避免连锁误判
    if (mem.content.startsWith('[待确认]')) continue

    const oldKeywordSet = new Set(extractKeyPhrases(mem.content))
    const overlap = newKeywords.filter((k) => oldKeywordSet.has(k))
    // 主题不相似（关键短语重叠不足 2 个）则跳过该记忆
    // 例外：如果两条记忆都包含日期，只需 1 个重叠即视为同一主题（防止 AI 改写措辞绕过日期冲突检测）
    const oldDateMatch = mem.content.match(/(\d{1,2})月(\d{1,2})日?/)
    const hasDates = dateMatch && oldDateMatch
    const minOverlap = hasDates ? 1 : 2
    if (overlap.length < minOverlap) continue

    // 规则 1：日期冲突（同一主题但不同日期）
    if (dateMatch) {
      if (
        oldDateMatch &&
        (dateMatch[1] !== oldDateMatch[1] || dateMatch[2] !== oldDateMatch[2])
      ) {
        return { hasConflict: true, conflictMemory: mem, reason: '日期冲突' }
      }
    }

    // 规则 1 扩展：生日冲突（"生日是X" vs "生日是Y"）
    if (birthdayMatch) {
      const oldBirthdayMatch = mem.content.match(/生日是(.{2,20})/)
      if (
        oldBirthdayMatch &&
        birthdayMatch[1].trim() !== oldBirthdayMatch[1].trim()
      ) {
        return { hasConflict: true, conflictMemory: mem, reason: '生日冲突' }
      }
    }

    // 规则 3：人物信息冲突（"X的Y是Z" 模式，同一主体同一属性但不同值）
    const newAttrMatch = newContent.match(/(.{2,10})的(.{2,8})是(.{2,20})/)
    const oldAttrMatch = mem.content.match(/(.{2,10})的(.{2,8})是(.{2,20})/)
    if (newAttrMatch && oldAttrMatch) {
      const newSubject = newAttrMatch[1].trim()
      const oldSubject = oldAttrMatch[1].trim()
      const newAttr = newAttrMatch[2].trim()
      const oldAttr = oldAttrMatch[2].trim()
      const newValue = newAttrMatch[3].trim()
      const oldValue = oldAttrMatch[3].trim()
      if (
        newSubject === oldSubject &&
        newAttr === oldAttr &&
        newValue !== oldValue
      ) {
        return { hasConflict: true, conflictMemory: mem, reason: '人物信息冲突' }
      }
    }
  }

  // === 规则 2：事实矛盾（向量相似度高但内容不同）===
  // 限制为最近 100 条记忆以控制 embedding 查询性能
  let newEmbedding: number[] = []
  try {
    newEmbedding = await getEmbedding(newContent)
  } catch {
    // embedding 获取失败，跳过事实矛盾检测
    return { hasConflict: false }
  }
  if (newEmbedding.length === 0) return { hasConflict: false }

  const recentMemories = existingMemories
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 100)

  for (const mem of recentMemories) {
    if (mem.content.startsWith('[待确认]')) continue

    const records = await db.embeddings
      .where({ sourceType: 'memory', sourceId: mem.id })
      .toArray()
    if (records.length === 0) continue

    const sim = cosineSimilarity(newEmbedding, records[0].embedding)
    // 相似度 > 0.75 且内容不同，视为潜在矛盾
    // 额外排除包含关系（一方是另一方的补充），避免正常补充信息被误判
    if (
      sim > 0.75 &&
      mem.content !== newContent &&
      !mem.content.includes(newContent) &&
      !newContent.includes(mem.content)
    ) {
      return { hasConflict: true, conflictMemory: mem, reason: '事实矛盾' }
    }
  }

  return { hasConflict: false }
}

// 构建人物名字/别名到 Person 的映射表
export function buildNameToPersonMap(people: Person[]): Map<string, Person> {
  const map = new Map<string, Person>()
  for (const person of people) {
    map.set(person.name.toLowerCase(), person)
    for (const nickname of person.profile?.identity?.nicknames || []) {
      if (nickname.trim()) {
        map.set(nickname.trim().toLowerCase(), person)
      }
    }
  }
  return map
}

// 将 LLM 提取的人物名字映射为数据库中的真实人物ID
export function resolvePersonIds(
  names: string[],
  nameToPersonMap: Map<string, Person>
): string[] {
  const ids = new Set<string>()
  for (const name of names) {
    const normalized = name.trim().toLowerCase()
    if (!normalized) continue
    const person = nameToPersonMap.get(normalized)
    if (person) {
      ids.add(person.id)
      continue
    }
    // 模糊匹配：查找包含该名字的人物（如"妈妈"可能对应"王妈妈"）
    for (const [key, person] of nameToPersonMap.entries()) {
      if (key.includes(normalized) || normalized.includes(key)) {
        ids.add(person.id)
      }
    }
  }
  return Array.from(ids)
}

// 获取人物的所有可识别称呼（名字 + 昵称 + 关系称呼）
export function getPersonAliases(person: Person): string[] {
  const aliases = new Set<string>([person.name])
  for (const nickname of person.profile?.identity?.nicknames || []) {
    if (nickname.trim()) aliases.add(nickname.trim())
  }
  // 根据关系类型添加常见称呼
  if (person.relationship === 'spouse') {
    aliases.add('妻子').add('爱人').add('老婆').add('老公').add('媳妇').add('丈夫')
  }
  if (person.relationship === 'family') {
    if (person.profile?.identity?.gender === 'female' || person.traits.some(t => t.includes('母') || t.includes('妈'))) {
      aliases.add('妈妈').add('母亲').add('老妈').add('妈')
    }
    if (person.profile?.identity?.gender === 'male' || person.traits.some(t => t.includes('父') || t.includes('爸'))) {
      aliases.add('爸爸').add('父亲').add('老爸').add('爸')
    }
    aliases.add('家人').add('亲戚')
  }
  if (person.relationship === 'leader') {
    aliases.add('老板').add('上司').add('主管').add('经理').add('总监').add('领导')
  }
  if (person.relationship === 'colleague') {
    aliases.add('同事').add('搭档').add('同僚')
  }
  if (person.relationship === 'friend') {
    aliases.add('朋友').add('哥们').add('同学').add('闺蜜')
  }
  return Array.from(aliases)
}

async function adjustRelationshipSentiments(
  extraction: ExtractionResult,
  allPeople: Person[]
): Promise<void> {
  for (const mem of extraction.memories) {
    for (const person of allPeople) {
      const aliases = getPersonAliases(person)
      const isMentioned = aliases.some(alias => mem.content.includes(alias))
      if (!isMentioned) continue

      let delta = 0

      // 根据记忆类型和内容调整温度
      if (mem.type === 'emotion') {
        const positive = ['开心', '温暖', '感动', '幸福', '笑', '好', '愉快', '欣慰']
        const negative = ['生气', '吵架', '冲突', '失望', '烦', '抱怨', '冷战', '不满']
        const isPositive = positive.some(w => mem.content.includes(w))
        const isNegative = negative.some(w => mem.content.includes(w))
        if (isPositive) delta = 3
        if (isNegative) delta = -3
      } else if (mem.type === 'event') {
        delta = 1 // 互动本身就是正面的
      } else if (mem.type === 'commitment') {
        delta = 2 // 承诺说明重视关系
      } else if (mem.type === 'preference') {
        delta = 1 // 了解偏好说明关注
      }

      if (delta !== 0) {
        try {
          const newSentiment = Math.max(0, Math.min(100, person.sentiment + delta))
          if (newSentiment !== person.sentiment) {
            const reason = buildSentimentReason(mem, delta)
            const newHistoryPoint = {
              timestamp: Date.now(),
              value: newSentiment,
              reason,
            }
            const sentimentHistory = [...(person.sentimentHistory || []), newHistoryPoint].slice(-50)
            await dataSyncService.updatePerson(person.id, {
              sentiment: newSentiment,
              sentimentHistory,
            })
            console.log(`[Relationship] ${person.name} 温度 ${person.sentiment} → ${newSentiment} (${delta > 0 ? '+' : ''}${delta})`)
          }
        } catch (err) {
          // FIX: 单个人物温度更新失败不中断循环
          console.error(`[Relationship] ${person.name} 温度更新失败:`, err)
        }
      }
    }
  }
}

function buildSentimentReason(mem: ExtractedMemory, delta: number): string {
  const direction = delta > 0 ? '上升' : '下降'
  const contentSnippet = mem.content.slice(0, 30)
  if (mem.type === 'emotion') {
    return `情绪记忆使关系温度${direction}：${contentSnippet}`
  }
  if (mem.type === 'commitment') {
    return `承诺/约定使关系温度${direction}：${contentSnippet}`
  }
  if (mem.type === 'event') {
    return `互动事件使关系温度${direction}：${contentSnippet}`
  }
  if (mem.type === 'preference') {
    return `了解偏好使关系温度${direction}：${contentSnippet}`
  }
  return `新记忆使关系温度${direction}：${contentSnippet}`
}
