import { chat } from '../lib/ai'
import { buildDigitalTwinReplyPrompt, getUserProfile } from '../lib/prompts'
import { getPersonAliases } from '../lib/memoryExtractor'
import { personRepository } from '../repositories'
import { tieredSearch } from '../lib/vectorStore'
import { buildSocialIntelligenceContext } from '../lib/socialIntelligence'

export interface ReplySuggestion {
  text: string
  tone: string
  reason: string
}

export interface GenerateReplyOptions {
  temperature?: number
  maxTokens?: number
  memoryLimits?: {
    hot?: number
    warm?: number
    cold?: number
  }
}

function getCurrentUserName(): string {
  try {
    const profile = getUserProfile()
    const match = profile.match(/姓名[：:]\s*(\S+)/)
    return match?.[1]?.trim() || '我'
  } catch {
    return '我'
  }
}

function buildSearchQuery(
  otherPerson: { name: string },
  aliases: string[],
  recentMessages: { sender: string; content: string }[],
  currentInput?: string
): string {
  const parts: string[] = []
  parts.push(otherPerson.name)
  if (aliases.length > 0) {
    parts.push(...aliases.slice(0, 5))
  }
  if (currentInput && currentInput.trim().length > 0) {
    parts.push(currentInput.trim())
  } else if (recentMessages.length > 0) {
    // 用最近 3 条消息作为检索上下文
    parts.push(...recentMessages.slice(-3).map(m => m.content))
  }
  return parts.join(' ')
}

function extractStyleHints(myName: string, messages: { sender: string; content: string }[]): string[] {
  const myMessages = messages.filter(m => m.sender === myName && m.content.trim().length > 0)
  if (myMessages.length === 0) {
    return ['保持自然、礼貌的回复风格']
  }

  const contents = myMessages.map(m => m.content)
  const totalLength = contents.reduce((sum, c) => sum + c.length, 0)
  const avgLength = totalLength / contents.length

  const hasEmoji = contents.some(c => /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[😀-🿿]|[🀀-🃏]|[🄀-🇿]/u.test(c))
  const questionRate = contents.filter(c => c.includes('？') || c.includes('?')).length / contents.length
  const hasExclamation = contents.some(c => c.includes('！') || c.includes('!'))
  const hasHumor = contents.some(c => /哈{2,}|呵呵|嘿嘿|哈哈/.test(c))
  const hasAffirmative = contents.some(c => /好的|OK|ok|行|没问题/.test(c))
  const hasPraise = contents.some(c => /棒|厉害|优秀|赞/.test(c))

  const hints: string[] = []

  if (avgLength < 15) {
    hints.push('回复简短，通常不超过15字')
  } else if (avgLength > 50) {
    hints.push('回复较详细，习惯说明背景或理由')
  } else {
    hints.push('回复长度适中')
  }

  if (hasEmoji) hints.push('常用表情符号')
  if (questionRate > 0.3) hints.push('常以问句引导对话')
  if (hasExclamation) hints.push('语气热情，常用感叹')
  if (hasHumor) hints.push('喜欢带幽默感')
  if (hasAffirmative) hints.push('常用肯定式回应')
  if (hasPraise) hints.push('习惯给予正面反馈')

  if (hints.length === 0) {
    hints.push('回复自然、简洁')
  }

  return hints
}

async function retrieveRelevantMemories(
  query: string,
  memoryLimits?: GenerateReplyOptions['memoryLimits']
): Promise<string[]> {
  const hotLimit = memoryLimits?.hot ?? 3
  const warmLimit = memoryLimits?.warm ?? 2
  const coldLimit = memoryLimits?.cold ?? 2

  try {
    const result = await tieredSearch(query, {
      sourceType: 'memory',
      hotLimit,
      warmLimit,
      coldLimit,
      minSimilarity: 0.25,
    })

    const seen = new Set<string>()
    const memories: string[] = []
    for (const record of [...result.hot, ...result.warm, ...result.cold]) {
      const text = record.text?.trim()
      if (!text || seen.has(text)) continue
      seen.add(text)
      memories.push(text)
    }
    return memories
  } catch (e) {
    console.warn('[digitalTwinService] 检索记忆失败:', e)
    return []
  }
}

function cleanJsonResponse(response: string): string {
  let cleaned = response
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim()

  // 修复 LLM 常见的 JSON 格式问题
  // 1. 替换中文引号为英文引号
  cleaned = cleaned
    .replace(/\u201c/g, '"')  // "
    .replace(/\u201d/g, '"')  // "
    .replace(/\u2018/g, "'")  // '
    .replace(/\u2019/g, "'")  // '

  // 2. 移除 JSON 前后的多余文本（找到第一个 [ 和最后一个 ]）
  const firstBracket = cleaned.indexOf('[')
  const lastBracket = cleaned.lastIndexOf(']')
  if (firstBracket > 0 || lastBracket < cleaned.length - 1) {
    if (firstBracket >= 0 && lastBracket > firstBracket) {
      cleaned = cleaned.substring(firstBracket, lastBracket + 1)
    }
  }

  // 3. 修复 JSON 字符串值中的未转义换行符
  // 匹配 "key": "value" 中 value 内的换行，替换为 \n
  cleaned = cleaned.replace(/:\s*"([^"]*)"/g, (match, value) => {
    if (value.includes('\n')) {
      return ': "' + value.replace(/\n/g, '\\n').replace(/\r/g, '\\r') + '"'
    }
    return match
  })

  // 4. 移除尾随逗号
  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1')

  return cleaned
}

/**
 * 尝试修复并解析 LLM 返回的 JSON
 * 如果标准 JSON.parse 失败，尝试逐步修复
 */
function parseJsonSafely(text: string): unknown[] | null {
  // 第一次尝试：直接解析
  try {
    const result = JSON.parse(text)
    return Array.isArray(result) ? result : null
  } catch {
    // 继续尝试修复
  }

  // 第二次尝试：提取每个对象，逐个解析
  try {
    const objects: unknown[] = []
    const objectRegex = /\{[^{}]*\}/g
    const matches = text.match(objectRegex)
    if (matches) {
      for (const match of matches) {
        try {
          const obj = JSON.parse(match)
          objects.push(obj)
        } catch {
          // 尝试修复单个对象
          const fixed = match
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t')
          try {
            const obj = JSON.parse(fixed)
            objects.push(obj)
          } catch {
            // 跳过无法解析的对象
          }
        }
      }
      if (objects.length > 0) return objects
    }
  } catch {
    // 继续尝试
  }

  // 第三次尝试：用正则提取 text/tone/reason 字段
  try {
    const objects: unknown[] = []
    const textRegex = /"text"\s*:\s*"((?:[^"\\]|\\.)*)"/gi
    const textMatches = [...text.matchAll(textRegex)]
    for (const match of textMatches) {
      objects.push({
        text: match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"'),
        tone: '',
        reason: '',
      })
    }
    if (objects.length > 0) return objects
  } catch {
    // 放弃
  }

  return null
}

export async function generateReplySuggestions(
  otherPersonId: string,
  recentMessages: { sender: string; content: string }[],
  currentInput?: string,
  options?: GenerateReplyOptions,
  fallbackPersonName?: string
): Promise<ReplySuggestion[]> {
  // 如果是 fallback ID（格式为 fallback-{name}），跳过数据库查询直接走降级路径
  let otherPerson: Person | null
  if (otherPersonId.startsWith('fallback-')) {
    otherPerson = null
  } else {
    otherPerson = await personRepository.getById(otherPersonId)
  }
  if (!otherPerson) {
    // 降级：使用 fallback 名称创建最小化 Person 对象
    const personName = fallbackPersonName || otherPersonId.replace(/^fallback-/, '')
    console.info(`[digitalTwinService] 使用降级人物信息: ${personName}`)
    otherPerson = {
      id: otherPersonId,
      name: personName,
      relationship: 'other',
      sentiment: 50,
      sentimentHistory: [],
      profile: {
        identity: { nicknames: [], fullName: personName },
        career: { strengths: [], weaknesses: [], careerHistory: [] },
        personality: { openness: 50, conscientiousness: 50, extraversion: 50, agreeableness: 50, neuroticism: 50, description: '' },
        preferences: { likes: [], dislikes: [], allergies: [], dietary: [], hobbies: [], communicationStyle: '' },
        values: { coreValues: [], motivations: [], fears: [], goals: [] },
        socialRole: { roleInMyLife: '', myRoleInTheirLife: '', powerDynamic: 'equal', trustLevel: 50, intimacyLevel: 50 },
        sharedExperiences: [],
      },
      timeline: [],
      connections: [],
      traits: [],
      tags: [],
    }
  }

  const myName = getCurrentUserName()
  const aliases = getPersonAliases(otherPerson)
  const styleHints = extractStyleHints(myName, recentMessages)
  const query = buildSearchQuery(otherPerson, aliases, recentMessages, currentInput)
  const relevantMemories = await retrieveRelevantMemories(query, options?.memoryLimits)

  // 生成社交智能上下文（差序格局+面子策略+人情账本）
  const currentInputText = currentInput || recentMessages.slice(-1)[0]?.content || ''
  const socialContext = buildSocialIntelligenceContext(
    otherPerson,
    currentInputText,
    relevantMemories.map(m => ({ id: '', content: m, type: 'other', createdAt: Date.now(), confidence: 'medium', tags: [], source: 'conversation' } as any))
  )

  const prompt = buildDigitalTwinReplyPrompt(
    myName,
    otherPerson.name,
    recentMessages,
    relevantMemories,
    styleHints,
    currentInput,
    socialContext
  )

  try {
    const response = await chat(
      [{ role: 'user', content: prompt }],
      {
        system: '你是回复建议生成器，只输出合法 JSON 数组，不要添加任何解释。',
        temperature: options?.temperature ?? 0.7,
        maxTokens: options?.maxTokens ?? 1024,
      }
    )

    const cleaned = cleanJsonResponse(response)
    const parsed = parseJsonSafely(cleaned)

    if (!parsed || !Array.isArray(parsed)) {
      console.warn('[digitalTwinService] LLM 输出解析失败，原始输出:', response.substring(0, 200))
      return []
    }

    return parsed
      .filter((item: unknown) => item && typeof item === 'object')
      .map((item: Record<string, unknown>) => ({
        text: String(item.text ?? ''),
        tone: String(item.tone ?? ''),
        reason: String(item.reason ?? ''),
      }))
      .filter((item: ReplySuggestion) => item.text.length > 0)
  } catch (e) {
    console.error('[digitalTwinService] 生成回复建议失败:', e)
    return []
  }
}
