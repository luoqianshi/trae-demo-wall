/**
 * 因果推理链 — 关系降温归因分析
 *
 * 企业级技术降维：IT 运维根因分析（Root Cause Analysis）→ 个人关系降温归因
 *
 * 核心思路：
 * - 企业级 RCA：系统告警时追溯事件链，定位故障根源
 * - 个人降维：关系温度下降时，追溯互动事件链，定位关系恶化的因果
 * - 不只说"温度低了"，而是说"因为3月10日预算被打回时你回复态度强硬→..."
 *
 * 实现：
 * 1. 从互动记录中提取事件（正面/负面/中性）
 * 2. 按时间排序构建事件序列
 * 3. 识别"转折点"（温度从升转降的关键事件）
 * 4. 构建因果链：原因事件 → 转折事件 → 结果状态
 * 5. 生成自然语言因果归因
 */

import type { Person, Memory } from '../types'

// ─── 类型定义 ───────────────────────────────────────────────

export type EventSentiment = 'positive' | 'negative' | 'neutral'

export interface CausalEvent {
  id: string
  timestamp: number
  description: string
  sentiment: EventSentiment
  impactScore: number // -10 到 +10，对关系的影响程度
  source: 'memory' | 'interaction' | 'inferred'
  isTurningPoint?: boolean // 是否为转折点
}

export interface CausalChain {
  personId: string
  personName: string
  currentSentiment: number
  previousSentiment: number | null
  trend: 'rising' | 'falling' | 'stable'
  events: CausalEvent[]
  rootCause: CausalEvent | null
  turningPoint: CausalEvent | null
  chainDescription: string
  visualTimeline: TimelineNode[]
  recommendation: string
}

export interface TimelineNode {
  date: string
  event: string
  sentiment: EventSentiment
  impact: number
  isRootCause?: boolean
  isTurningPoint?: boolean
  cumulativeScore: number
}

// ─── 事件提取 ───────────────────────────────────────────────

/**
 * 从记忆/互动记录中提取因果事件
 */
export function extractCausalEvents(
  memories: Memory[],
  person: Person,
): CausalEvent[] {
  const events: CausalEvent[] = []

  // 从记忆中提取与该人物相关的事件
  const personMemories = memories.filter(m => {
    const relatedIds = m.relatedPersonIds || []
    return relatedIds.includes(person.id)
  })

  for (const memory of personMemories) {
    const sentiment = analyzeMemorySentiment(memory)
    const impact = calculateImpact(memory, sentiment)

    events.push({
      id: memory.id,
      timestamp: memory.timestamp || memory.createdAt || 0,
      description: memory.content.slice(0, 200),
      sentiment,
      impactScore: impact,
      source: 'memory',
    })
  }

  // 从人物描述中推断关键事件
  const description = [
    person.profile?.personality?.description || '',
    person.profile?.career?.workStyle || '',
    person.tags?.join(' ') || '',
  ].join(' ')
  const inferredEvents = inferEventsFromDescription(description, person)
  events.push(...inferredEvents)

  // 按时间排序
  events.sort((a, b) => a.timestamp - b.timestamp)

  return events
}

/**
 * 分析记忆的情感倾向
 */
function analyzeMemorySentiment(memory: Memory): EventSentiment {
  const content = memory.content.toLowerCase()

  // 负面关键词
  const negativePatterns = [
    /冲突|矛盾|争执|吵架|打回|拒绝|批评|不满|抱怨|失望|生气|愤怒|冷淡|疏远|对立|质疑|压价|难缠|头疼|痛苦|打回|严格|算计|纠纷|借.*不还|催|压力/,
  ]

  // 正面关键词
  const positivePatterns = [
    /合作|愉快|感谢|开心|信任|亲密|温暖|支持|帮助|鼓励|认可|赞赏|默契|开心|聚会|钓鱼|坚持|效果.*好|天赋|到位|投机/,
  ]

  for (const pattern of negativePatterns) {
    if (pattern.test(content)) return 'negative'
  }
  for (const pattern of positivePatterns) {
    if (pattern.test(content)) return 'positive'
  }

  return 'neutral'
}

/**
 * 计算事件对关系的影响程度
 */
function calculateImpact(memory: Memory, sentiment: EventSentiment): number {
  let base = 0
  if (sentiment === 'negative') base = -5
  if (sentiment === 'positive') base = +3
  if (sentiment === 'neutral') base = 0

  // 根据记忆类型加权
  const typeWeight: Record<string, number> = {
    'conflict': 2.0,
    'agreement': 1.5,
    'social': 1.0,
    'work': 1.2,
    'family': 1.3,
    'promise': 1.8,
  }
  const weight = typeWeight[memory.type || ''] || 1.0

  return Math.round(base * weight)
}

/**
 * 从人物描述中推断关键事件
 */
function inferEventsFromDescription(description: string, person: Person): CausalEvent[] {
  const events: CausalEvent[] = []
  const now = Date.now()

  // 识别描述中的负面事件
  const negativePatterns = [
    { pattern: /排期.*冲突|公开.*说|质疑/, impact: -7, desc: '公开质疑/排期冲突' },
    { pattern: /审批.*严格|预算.*打回|打回/, impact: -6, desc: '预算被打回/审批严格' },
    { pattern: /预算.*竞争|会上.*争执/, impact: -5, desc: '预算竞争/公开争执' },
    { pattern: /难缠|压价|挑剔/, impact: -6, desc: '客户难缠/压价' },
    { pattern: /房产.*纠纷|遗产.*矛盾|算计/, impact: -7, desc: '财产纠纷' },
    { pattern: /借.*不还|借钱/, impact: -4, desc: '借钱不还' },
    { pattern: /催|压力|期待.*更上进/, impact: -3, desc: '施压/期待落差' },
    { pattern: /焦虑|攀比|制造.*压力/, impact: -3, desc: '制造焦虑' },
    { pattern: /谈不拢|估值/, impact: -4, desc: '谈判分歧' },
  ]

  for (const { pattern, impact, desc } of negativePatterns) {
    if (pattern.test(description)) {
      events.push({
        id: `inferred-${person.id}-${events.length}`,
        timestamp: now - Math.random() * 30 * 24 * 60 * 60 * 1000, // 随机过去30天内
        description: desc,
        sentiment: 'negative',
        impactScore: impact,
        source: 'inferred',
      })
    }
  }

  // 识别正面事件
  const positivePatterns = [
    { pattern: /钓鱼.*聚会|每周.*跑步|坚持/, impact: +5, desc: '定期共同活动' },
    { pattern: /天赋|效果.*好|到位/, impact: +4, desc: '获得认可' },
    { pattern: /投机|放松|默契/, impact: +3, desc: '关系融洽' },
  ]

  for (const { pattern, impact, desc } of positivePatterns) {
    if (pattern.test(description)) {
      events.push({
        id: `inferred-${person.id}-${events.length}`,
        timestamp: now - Math.random() * 14 * 24 * 60 * 60 * 1000,
        description: desc,
        sentiment: 'positive',
        impactScore: impact,
        source: 'inferred',
      })
    }
  }

  return events
}

// ─── 因果链构建 ─────────────────────────────────────────────

/**
 * 构建因果链
 * 识别转折点和根因
 */
export function buildCausalChain(
  person: Person,
  memories: Memory[],
  previousSentiment?: number,
): CausalChain {
  const events = extractCausalEvents(memories, person)
  const currentSentiment = person.sentiment

  // 判断趋势
  let trend: 'rising' | 'falling' | 'stable' = 'stable'
  if (previousSentiment !== undefined) {
    const diff = currentSentiment - previousSentiment
    if (diff > 5) trend = 'rising'
    else if (diff < -5) trend = 'falling'
  } else {
    // 根据近期事件判断趋势
    const recentEvents = events.slice(-5)
    const recentImpact = recentEvents.reduce((sum, e) => sum + e.impactScore, 0)
    if (recentImpact > 3) trend = 'rising'
    else if (recentImpact < -3) trend = 'falling'
  }

  // 识别转折点：影响最大的负面事件
  const negativeEvents = events.filter(e => e.sentiment === 'negative')
  const turningPoint = negativeEvents.length > 0
    ? negativeEvents.reduce((max, e) => Math.abs(e.impactScore) > Math.abs(max.impactScore) ? e : max)
    : null

  if (turningPoint) {
    turningPoint.isTurningPoint = true
  }

  // 识别根因：最早的负面事件
  const rootCause = negativeEvents.length > 0
    ? negativeEvents[0]
    : null

  if (rootCause) {
    rootCause.isTurningPoint = rootCause.id === turningPoint?.id
  }

  // 构建可视化时间线
  let cumulativeScore = 50 // 起始分数
  const visualTimeline: TimelineNode[] = events.map(event => {
    cumulativeScore += event.impactScore
    return {
      date: formatDate(event.timestamp),
      event: event.description.slice(0, 60),
      sentiment: event.sentiment,
      impact: event.impactScore,
      isRootCause: event.id === rootCause?.id,
      isTurningPoint: event.id === turningPoint?.id,
      cumulativeScore: Math.max(0, Math.min(100, cumulativeScore)),
    }
  })

  // 生成因果链描述
  const chainDescription = generateChainDescription(person, events, rootCause, turningPoint, trend)

  // 生成建议
  const recommendation = generateRecommendation(person, trend, rootCause, turningPoint)

  return {
    personId: person.id,
    personName: person.name,
    currentSentiment,
    previousSentiment: previousSentiment ?? null,
    trend,
    events,
    rootCause,
    turningPoint,
    chainDescription,
    visualTimeline,
    recommendation,
  }
}

function formatDate(timestamp: number): string {
  if (!timestamp) return '未知时间'
  const date = new Date(timestamp)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (24 * 60 * 60 * 1000))
  if (diffDays === 0) return '今天'
  if (diffDays === 1) return '昨天'
  if (diffDays < 7) return `${diffDays}天前`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

function generateChainDescription(
  person: Person,
  events: CausalEvent[],
  rootCause: CausalEvent | null,
  turningPoint: CausalEvent | null,
  trend: 'rising' | 'falling' | 'stable',
): string {
  const parts: string[] = []
  parts.push(`${person.name}当前关系温度 ${person.sentiment}°`)

  if (trend === 'falling') {
    parts.push('，趋势下行')
  } else if (trend === 'rising') {
    parts.push('，趋势上升')
  } else {
    parts.push('，趋势平稳')
  }

  if (rootCause && turningPoint) {
    parts.push('。')

    if (rootCause.id === turningPoint.id) {
      parts.push(`关键转折事件：「${rootCause.description.slice(0, 50)}」`)
      parts.push(`（影响度 ${rootCause.impactScore}）`)
    } else {
      parts.push(`根因事件：「${rootCause.description.slice(0, 50)}」`)
      parts.push(` → 转折点：「${turningPoint.description.slice(0, 50)}」`)
    }

    // 构建因果链
    const chainEvents = events.filter(e =>
      e.timestamp >= (rootCause.timestamp || 0) &&
      e.sentiment === 'negative'
    ).slice(0, 4)

    if (chainEvents.length > 1) {
      parts.push('。事件链：')
      parts.push(chainEvents.map((e, i) =>
        `${i + 1}.「${e.description.slice(0, 30)}」(${e.impactScore > 0 ? '+' : ''}${e.impactScore})`
      ).join(' → '))
    }
  } else if (events.length > 0) {
    parts.push('。近期互动以')
    const posCount = events.filter(e => e.sentiment === 'positive').length
    const negCount = events.filter(e => e.sentiment === 'negative').length
    if (posCount > negCount) {
      parts.push('正面为主')
    } else if (negCount > posCount) {
      parts.push('负面为主')
    } else {
      parts.push('中性为主')
    }
  }

  return parts.join('')
}

function generateRecommendation(
  person: Person,
  trend: 'rising' | 'falling' | 'stable',
  rootCause: CausalEvent | null,
  turningPoint: CausalEvent | null,
): string {
  if (trend === 'falling' && person.sentiment < 30) {
    if (turningPoint) {
      return `关系处于危险区。核心问题是「${turningPoint.description.slice(0, 30)}」，建议尽快主动沟通化解。`
    }
    return '关系温度过低，建议立即主动联系，寻找共同话题重建连接。'
  }

  if (trend === 'falling' && person.sentiment < 50) {
    return '关系有降温趋势，建议近期安排一次非正式互动（如吃饭、咖啡）来回暖。'
  }

  if (trend === 'stable' && person.sentiment < 40) {
    return '关系长期冷淡，如果不主动改善可能进一步恶化。建议寻找合作机会。'
  }

  if (trend === 'rising') {
    return '关系正在升温，保持当前互动频率即可。可以考虑深化关系。'
  }

  return '关系状态平稳，保持定期互动即可。'
}

// ─── 批量分析 ───────────────────────────────────────────────

/**
 * 批量分析所有需要预警的人物因果链
 */
export async function analyzeAtRiskPeople(
  people: Person[],
  memories: Memory[],
): Promise<CausalChain[]> {
  const chains: CausalChain[] = []

  for (const person of people) {
    // 只分析温度低于 40 或有负面描述的人物
    const desc = [
      person.profile?.personality?.description || '',
      person.profile?.career?.workStyle || '',
      person.tags?.join(' ') || '',
    ].join(' ')
    if (person.sentiment < 40 || /冲突|打回|难缠|纠纷|对立|争执|催|压力|算计/.test(desc)) {
      const chain = buildCausalChain(person, memories)
      chains.push(chain)
    }
  }

  // 按温度排序，最冷的在前
  chains.sort((a, b) => a.currentSentiment - b.currentSentiment)
  return chains
}
