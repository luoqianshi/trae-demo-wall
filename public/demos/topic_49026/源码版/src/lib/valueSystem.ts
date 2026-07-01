/**
 * 用户价值体系引擎
 *
 * 三大功能：
 * 1. 从对话中提取用户价值观（轻量级规则 + AI 深度提取）
 * 2. 将价值画像注入 System Prompt
 * 3. 检测回复建议与用户价值观的冲突
 *
 * 设计理念：
 * - 不是每条消息都提取，只在用户表达价值判断时触发
 * - 提取结果累积存储，越用越精准
 * - 普世价值优先于个人价值观：极端问题上可以提出不同建议
 */

import type { UserValueSystem } from '../types'
import { chat } from './ai'

// ============================================================
// 存储
// ============================================================

const VALUE_SYSTEM_KEY = 'hengzhou-user-value-system'

/** 获取用户价值体系 */
export function getUserValueSystem(): UserValueSystem {
  const raw = localStorage.getItem(VALUE_SYSTEM_KEY)
  if (!raw) {
    return { valueKeywords: [], principles: [] }
  }
  try {
    const parsed = JSON.parse(raw) as UserValueSystem
    return {
      ...parsed,
      valueKeywords: parsed.valueKeywords || [],
      principles: parsed.principles || [],
    }
  } catch {
    return { valueKeywords: [], principles: [] }
  }
}

/** 保存用户价值体系 */
export function setUserValueSystem(vs: UserValueSystem): void {
  vs.updatedAt = Date.now()
  localStorage.setItem(VALUE_SYSTEM_KEY, JSON.stringify(vs))
}

/** 合并更新（增量式，不覆盖已有值） */
export function mergeValueSystem(updates: Partial<UserValueSystem>): UserValueSystem {
  const current = getUserValueSystem()
  const merged: UserValueSystem = {
    ...current,
    ...updates,
    // 数组字段去重合并
    valueKeywords: dedupe([...(current.valueKeywords || []), ...(updates.valueKeywords || [])]),
    principles: dedupe([...(current.principles || []), ...(updates.principles || [])]),
  }
  // 枚举字段：有更新才覆盖
  if (updates.justiceProfitOrientation) merged.justiceProfitOrientation = updates.justiceProfitOrientation
  if (updates.boundaryStyle) merged.boundaryStyle = updates.boundaryStyle
  if (updates.lifePhilosophy) merged.lifePhilosophy = updates.lifePhilosophy
  if (updates.decisionPhilosophy) merged.decisionPhilosophy = updates.decisionPhilosophy
  if (updates.relationshipOrientation) merged.relationshipOrientation = updates.relationshipOrientation
  if (updates.conflictStyle) merged.conflictStyle = updates.conflictStyle
  setUserValueSystem(merged)
  return merged
}

function dedupe(arr: string[]): string[] {
  return Array.from(new Set(arr.map(s => s.trim()).filter(Boolean)))
}

// ============================================================
// 轻量级规则提取（不调用 AI，快速 heuristics）
// ============================================================

/** 判断用户消息是否包含价值判断信号 */
export function hasValueSignal(userMessage: string): boolean {
  const signals = [
    /我觉得做人应该/,
    /我的原则是/,
    /我信奉/,
    /我讲究/,
    /在我看来/,
    /做人不能/,
    /帮人帮到底/,
    /亲兄弟.*算账/,
    /以德报怨/,
    /以直报怨/,
    /天下熙熙.*皆为利来/,
    /君子.*喻于义/,
    /小人.*喻于利/,
    /人不为己/,
    /吃亏是福/,
    /不占.*便宜/,
    /边界感/,
    /仁义/,
    /忠孝/,
    /情义/,
    /利益交换/,
    /等价交换/,
    /互惠/,
    /宽容/,
    /计较/,
    /退一步海阔天空/,
    /得理不饶人/,
    /人脉就是钱脉/,
    /感情不能用钱衡量/,
    /亲兄弟明算账/,
    /一家人不说两家话/,
    /帮人是情分不帮是本分/,
    /滴水之恩.*涌泉相报/,
    /人走茶凉/,
    /过河拆桥/,
  ]
  return signals.some(p => p.test(userMessage))
}

/** 轻量级规则提取（快速，不调 AI） */
export function extractValueSignalsFast(userMessage: string): Partial<UserValueSystem> | null {
  const updates: Partial<UserValueSystem> = {}
  let changed = false

  // 义利取向
  if (/天下熙熙.*皆为利来|利益交换|等价交换|人不为己|人脉就是钱脉/.test(userMessage)) {
    updates.justiceProfitOrientation = 'profit'
    changed = true
  } else if (/君子.*喻于义|仁义|忠孝|情义|感情不能用钱衡量/.test(userMessage)) {
    updates.justiceProfitOrientation = 'justice'
    changed = true
  }

  // 边界感
  if (/亲兄弟.*算账|边界感|帮人是情分不帮是本分|人走茶凉|过河拆桥/.test(userMessage)) {
    updates.boundaryStyle = 'clear'
    changed = true
  } else if (/一家人不说两家话|帮人帮到底|不分彼此|你的就是我的/.test(userMessage)) {
    updates.boundaryStyle = 'permeable'
    changed = true
  }

  // 处世哲学
  if (/以德报怨|吃亏是福|退一步海阔天空|宽容|不计较/.test(userMessage)) {
    updates.lifePhilosophy = 'forgiving'
    changed = true
  } else if (/以直报怨|得理不饶人|亲兄弟明算账|原则问题上不让步/.test(userMessage)) {
    updates.lifePhilosophy = 'reciprocal'
    changed = true
  } else if (/务实|结果导向|效率优先|投入产出/.test(userMessage)) {
    updates.lifePhilosophy = 'pragmatic'
    changed = true
  } else if (/理想|信念|坚持初心|宁折不弯/.test(userMessage)) {
    updates.lifePhilosophy = 'idealistic'
    changed = true
  }

  // 决策模式
  if (/给我数据|列个清单|分析一下利弊|量化/.test(userMessage)) {
    updates.decisionPhilosophy = 'analytical'
    changed = true
  } else if (/我觉得|直觉告诉我|凭感觉|第六感/.test(userMessage)) {
    updates.decisionPhilosophy = 'intuitive'
    changed = true
  } else if (/帮我问问|找.*商量|听听.*意见/.test(userMessage)) {
    updates.decisionPhilosophy = 'consultative'
    changed = true
  } else if (/我自己决定|不用管我|我自己想清楚/.test(userMessage)) {
    updates.decisionPhilosophy = 'autonomous'
    changed = true
  }

  // 人际取向
  if (/关系最重要|人情世故|先做人后做事|关系到位了什么都好说/.test(userMessage)) {
    updates.relationshipOrientation = 'relationship_first'
    changed = true
  } else if (/结果导向|效率优先|对事不对人|公事公办/.test(userMessage)) {
    updates.relationshipOrientation = 'task_first'
    changed = true
  }

  // 冲突处理风格
  if (/算了|忍忍就过去了|多一事不如少一事|退一步/.test(userMessage)) {
    updates.conflictStyle = 'avoidant'
    changed = true
  } else if (/坐下来谈|沟通解决|双赢|找个折中方案/.test(userMessage)) {
    updates.conflictStyle = 'collaborative'
    changed = true
  } else if (/据理力争|不能认怂|硬刚|正面刚/.test(userMessage)) {
    updates.conflictStyle = 'competitive'
    changed = true
  } else if (/让着他吧|不计较了|大度一点/.test(userMessage)) {
    updates.conflictStyle = 'accommodating'
    changed = true
  }

  // 提取价值关键词和处事原则（自由文本）
  const keywords = extractKeywords(userMessage)
  if (keywords.length > 0) {
    updates.valueKeywords = keywords
    changed = true
  }

  const principles = extractPrinciples(userMessage)
  if (principles.length > 0) {
    updates.principles = principles
    changed = true
  }

  return changed ? updates : null
}

/** 从消息中提取价值关键词 */
function extractKeywords(message: string): string[] {
  const keywords: string[] = []
  const patterns: RegExp[] = [
    /(?:我信奉|我讲究|我觉得做人应该|我的原则是|做人不能)(.{2,10})/,
    /(?:在我看来)(.{2,15})/,
  ]
  for (const p of patterns) {
    const m = message.match(p)
    if (m && m[1]) {
      // 提取关键词部分
      const text = m[1].trim()
      // 按标点分割取有意义的词
      const words = text.split(/[，,。；;！!？?、的]/).filter(w => w.length >= 2 && w.length <= 8)
      keywords.push(...words)
    }
  }
  // 直接匹配常见价值词汇
  const directMatches = ['仁义', '忠孝', '情义', '效率', '自由', '公平', '诚信', '务实', '宽容', '原则', '底线', '面子', '里子']
  for (const kw of directMatches) {
    if (message.includes(kw)) keywords.push(kw)
  }
  return dedupe(keywords)
}

/** 从消息中提取处事原则 */
function extractPrinciples(message: string): string[] {
  const principles: string[] = []
  // 匹配"我XXX"格式的原则陈述
  const patterns: RegExp[] = [
    /我的原则是[：:，,]?\s*(.{4,30})/,
    /我讲究(.{4,30})/,
    /我信奉(.{4,30})/,
    /我觉得做人应该(.{4,30})/,
    /做人不能(.{4,20})/,
    /帮人帮到底[，,]?(.{0,20})/,
    /亲兄弟明算账/,
    /不占.*?便宜/,
    /滴水之恩.*?涌泉相报/,
    /以德报怨/,
    /以直报怨/,
    /帮人是情分不帮是本分/,
  ]
  for (const p of patterns) {
    const m = message.match(p)
    if (m && m[0]) {
      principles.push(m[0].trim().substring(0, 50))
    }
  }
  return dedupe(principles)
}

// ============================================================
// AI 深度提取（当规则提取不够时，调用 AI 做结构化分析）
// ============================================================

const VALUE_EXTRACTION_PROMPT = `你是用户价值观分析专家。请从用户的发言中分析其价值取向。

用户发言：
{userMessage}

已有价值观记录（供参考，不要简单重复）：
{existingValues}

请分析用户在以下维度的取向（只分析能从发言中明确推断的，不确定的留空）：

1. justiceProfitOrientation（义利取向）：
   - "justice"：重义轻利，强调道义、情义、仁义
   - "profit"：重利务实，强调利益、效率、投入产出
   - "balanced"：义利兼顾

2. boundaryStyle（边界感）：
   - "clear"：边界分明，亲兄弟明算账
   - "permeable"：边界模糊，一家人不说两家话
   - "flexible"：因人因事灵活调整

3. lifePhilosophy（处世哲学）：
   - "forgiving"：宽容型，以德报怨，吃亏是福
   - "reciprocal"：对等型，以直报怨，礼尚往来
   - "pragmatic"：务实型，结果导向，灵活变通
   - "idealistic"：理想型，坚持原则，宁折不弯

4. decisionPhilosophy（决策模式）：
   - "analytical"：理性分析，要数据支撑
   - "intuitive"：直觉判断，凭感觉
   - "consultative"：商量型，听取多方意见
   - "autonomous"：自主型，自己决定

5. conflictStyle（冲突处理）：
   - "avoidant"：回避型，多一事不如少一事
   - "collaborative"：协作型，坐下来谈
   - "competitive"：竞争型，据理力争
   - "accommodating"：迁就型，让着他吧

6. valueKeywords（价值关键词）：从发言中提取2-5个核心价值词汇
7. principles（处事原则）：从发言中提取1-3条具体处事原则

请以 JSON 格式输出，只包含有明确证据的字段：
{
  "justiceProfitOrientation": "...",
  "boundaryStyle": "...",
  "lifePhilosophy": "...",
  "decisionPhilosophy": "...",
  "conflictStyle": "...",
  "valueKeywords": ["...", "..."],
  "principles": ["...", "..."],
  "reasoning": "简要说明分析依据（1-2句话）"
}

如果用户发言中没有明确的价值取向表达，返回空 JSON：{}`

/** AI 深度提取用户价值观 */
export async function extractValueSystemWithAI(
  userMessage: string,
  conversationHistory: { role: string; content: string }[]
): Promise<Partial<UserValueSystem> | null> {
  const existing = getUserValueSystem()
  const existingSummary = JSON.stringify({
    justiceProfitOrientation: existing.justiceProfitOrientation,
    boundaryStyle: existing.boundaryStyle,
    lifePhilosophy: existing.lifePhilosophy,
    decisionPhilosophy: existing.decisionPhilosophy,
    conflictStyle: existing.conflictStyle,
    valueKeywords: existing.valueKeywords,
    principles: existing.principles,
  })

  // 取最近5轮对话作为上下文
  const recentHistory = conversationHistory.slice(-10)
    .map(m => `${m.role === 'user' ? '用户' : '衡舟'}：${m.content}`)
    .join('\n')

  const prompt = VALUE_EXTRACTION_PROMPT
    .replace('{userMessage}', userMessage)
    .replace('{existingValues}', existingSummary)

  try {
    const result = await chat(
      [
        { role: 'system', content: '你是用户心理分析专家，擅长从自然对话中识别用户的价值观和思维方式。只输出JSON。' },
        { role: 'user', content: `对话历史：\n${recentHistory}\n\n${prompt}` },
      ],
      { temperature: 0.2, maxTokens: 512, preferDoubao: true }
    )

    // 解析 JSON
    const jsonMatch = result.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    const parsed = JSON.parse(jsonMatch[0])
    const updates: Partial<UserValueSystem> = {}

    // 只取有明确值的字段
    const enumFields: (keyof UserValueSystem)[] = [
      'justiceProfitOrientation', 'boundaryStyle', 'lifePhilosophy',
      'decisionPhilosophy', 'conflictStyle',
    ]
    for (const field of enumFields) {
      const val = parsed[field]
      if (val && typeof val === 'string' && val.length > 0) {
        ;(updates as any)[field] = val
      }
    }
    if (Array.isArray(parsed.valueKeywords) && parsed.valueKeywords.length > 0) {
      updates.valueKeywords = parsed.valueKeywords.filter((k: any) => typeof k === 'string')
    }
    if (Array.isArray(parsed.principles) && parsed.principles.length > 0) {
      updates.principles = parsed.principles.filter((p: any) => typeof p === 'string')
    }

    if (parsed.reasoning) {
      console.log('[ValueSystem] AI提取推理:', parsed.reasoning)
    }

    // 检查是否有有效更新
    const hasUpdate = Object.keys(updates).some(k => {
      const v = (updates as any)[k]
      return Array.isArray(v) ? v.length > 0 : v != null
    })

    return hasUpdate ? updates : null
  } catch (e) {
    console.warn('[ValueSystem] AI提取失败:', e)
    return null
  }
}

// ============================================================
// 价值画像注入 Prompt
// ============================================================

const VALUE_LABELS: Record<string, Record<string, string>> = {
  justiceProfitOrientation: {
    justice: '重义轻利（强调道义、情义）',
    profit: '重利务实（强调利益、效率）',
    balanced: '义利兼顾',
  },
  boundaryStyle: {
    clear: '边界分明（亲兄弟明算账）',
    permeable: '边界模糊（一家人不说两家话）',
    flexible: '因人因事灵活调整',
  },
  lifePhilosophy: {
    forgiving: '宽容型（以德报怨，吃亏是福）',
    reciprocal: '对等型（以直报怨，礼尚往来）',
    pragmatic: '务实型（结果导向，灵活变通）',
    idealistic: '理想型（坚持原则，宁折不弯）',
  },
  decisionPhilosophy: {
    analytical: '理性分析型（要数据支撑）',
    intuitive: '直觉判断型（凭感觉）',
    consultative: '商量型（听取多方意见）',
    autonomous: '自主型（自己决定）',
  },
  relationshipOrientation: {
    relationship_first: '关系优先（先做人后做事）',
    task_first: '任务优先（对事不对人）',
    balanced: '关系与任务兼顾',
  },
  conflictStyle: {
    avoidant: '回避型（多一事不如少一事）',
    collaborative: '协作型（坐下来谈，找双赢）',
    competitive: '竞争型（据理力争）',
    accommodating: '迁就型（让着他吧，大度一点）',
  },
}

/** 生成用户价值画像的 Prompt 片段 */
export function buildValueSystemPrompt(): string {
  const vs = getUserValueSystem()

  // 没有任何价值信息时不输出
  const hasEnumValue = vs.justiceProfitOrientation || vs.boundaryStyle || vs.lifePhilosophy ||
    vs.decisionPhilosophy || vs.relationshipOrientation || vs.conflictStyle
  const hasKeywords = vs.valueKeywords.length > 0
  const hasPrinciples = vs.principles.length > 0

  if (!hasEnumValue && !hasKeywords && !hasPrinciples) {
    return ''
  }

  const parts: string[] = []
  parts.push('\n【用户价值画像（思维方式与处世哲学）】')
  parts.push('以下是该用户本人的价值取向，你的建议方向应顺应其思维方式：')

  // 枚举字段
  const fields: (keyof UserValueSystem)[] = [
    'justiceProfitOrientation', 'boundaryStyle', 'lifePhilosophy',
    'decisionPhilosophy', 'relationshipOrientation', 'conflictStyle',
  ]
  for (const field of fields) {
    const val = vs[field] as string | undefined
    if (val && VALUE_LABELS[field] && VALUE_LABELS[field][val]) {
      parts.push(`- ${VALUE_LABELS[field][val]}`)
    }
  }

  // 价值关键词
  if (hasKeywords) {
    parts.push(`- 价值关键词：${vs.valueKeywords.join('、')}`)
  }

  // 处事原则
  if (hasPrinciples) {
    parts.push(`- 处事原则：`)
    vs.principles.forEach(p => parts.push(`  · ${p}`))
  }

  // 关键指导原则
  parts.push('')
  parts.push('【建议适配原则】')
  if (vs.lifePhilosophy === 'forgiving') {
    parts.push('- 用户倾向宽容待人，建议方向应顺应其"以德报怨"倾向，但涉及底线问题时可温和提醒保护自己')
  }
  if (vs.lifePhilosophy === 'reciprocal') {
    parts.push('- 用户讲究对等原则，建议应尊重其"礼尚往来"逻辑，不劝其单方面付出')
  }
  if (vs.boundaryStyle === 'clear') {
    parts.push('- 用户注重边界感，建议涉及人际边界时尊重其"亲兄弟明算账"原则')
  }
  if (vs.boundaryStyle === 'permeable') {
    parts.push('- 用户边界感模糊，建议可适度提醒注意自我保护，但不否定其互助精神')
  }
  if (vs.justiceProfitOrientation === 'profit') {
    parts.push('- 用户务实重利，建议应包含利益分析和投入产出考量')
  }
  if (vs.justiceProfitOrientation === 'justice') {
    parts.push('- 用户重义轻利，建议应从道义和情义角度出发，不宜过度强调利益算计')
  }
  if (vs.decisionPhilosophy === 'analytical') {
    parts.push('- 用户决策偏理性，建议应提供数据、利弊分析、可量化指标')
  }
  if (vs.decisionPhilosophy === 'intuitive') {
    parts.push('- 用户决策偏直觉，建议应帮其梳理直觉背后的真实顾虑，而非堆砌数据')
  }
  if (vs.conflictStyle === 'avoidant') {
    parts.push('- 用户倾向回避冲突，建议应循序渐进，不强迫其正面硬刚')
  }
  if (vs.conflictStyle === 'competitive') {
    parts.push('- 用户倾向正面竞争，建议应肯定其勇气，但适时提醒评估风险')
  }

  // 普世价值兜底
  parts.push('')
  parts.push('【普世价值兜底】')
  parts.push('当用户价值观可能导致严重伤害（身心安全、法律风险、重大财产损失）时，')
  parts.push('你有责任基于普世价值提出与用户价值观不完全相同的合理建议，')
  parts.push('但语气应尊重而非说教，用"我理解你的想法，同时我也担心..."的方式表达。')

  return parts.join('\n')
}

// ============================================================
// 价值观冲突检测
// ============================================================

export interface ValueConflictResult {
  /** 是否检测到冲突 */
  hasConflict: boolean
  /** 冲突描述 */
  conflicts: Array<{
    type: string
    description: string
    severity: 'low' | 'medium' | 'high'
    suggestion: string
  }>
}

/**
 * 检测回复内容是否与用户价值观冲突
 * 注意：冲突不意味着必须修改，而是提示 AI 注意
 */
export function checkValueConflict(replyContent: string): ValueConflictResult {
  const vs = getUserValueSystem()
  const conflicts: ValueConflictResult['conflicts'] = []

  // 没有价值观记录时不检测
  if (!vs.justiceProfitOrientation && !vs.boundaryStyle && !vs.lifePhilosophy &&
      !vs.conflictStyle && vs.principles.length === 0) {
    return { hasConflict: false, conflicts: [] }
  }

  // 检测1：用户重义，但回复过度强调利益
  if (vs.justiceProfitOrientation === 'justice') {
    if (/投入产出|利益最大化|划得来|性价比|回报率|利益交换/.test(replyContent)) {
      conflicts.push({
        type: 'justice_profit_mismatch',
        description: '用户重义轻利，但回复过度强调利益分析',
        severity: 'low',
        suggestion: '可保留利益分析，但应以道义和情义为主要论据',
      })
    }
  }

  // 检测2：用户边界分明，但回复建议模糊边界
  if (vs.boundaryStyle === 'clear') {
    if (/一家人不说两家话|不分彼此|你的就是我的|别计较/.test(replyContent)) {
      conflicts.push({
        type: 'boundary_mismatch',
        description: '用户注重边界分明，但回复建议模糊人际边界',
        severity: 'medium',
        suggestion: '应尊重用户的边界感，建议明确界限而非模糊处理',
      })
    }
  }

  // 检测3：用户宽容型，但回复建议强硬对抗
  if (vs.lifePhilosophy === 'forgiving') {
    if (/据理力争|正面刚|不能认怂|硬刚|以牙还牙|以眼还眼/.test(replyContent)) {
      conflicts.push({
        type: 'philosophy_mismatch',
        description: '用户倾向宽容，但回复建议强硬对抗',
        severity: 'medium',
        suggestion: '应顺应用户的宽容倾向，建议以理解和退让为主',
      })
    }
  }

  // 检测4：用户回避冲突型，但回复建议直接对质
  if (vs.conflictStyle === 'avoidant') {
    if (/直接跟.*说|当面问清楚|摊牌|正面对质/.test(replyContent)) {
      conflicts.push({
        type: 'conflict_style_mismatch',
        description: '用户倾向回避冲突，但回复建议直接对质',
        severity: 'low',
        suggestion: '可建议更委婉的沟通方式，如通过第三方传话或书信表达',
      })
    }
  }

  // 检测5：用户务实型，但回复过于理想化
  if (vs.lifePhilosophy === 'pragmatic') {
    if (/坚持初心|宁折不弯|理想主义|不管结果如何都要/.test(replyContent)) {
      conflicts.push({
        type: 'pragmatism_mismatch',
        description: '用户务实，但回复过于理想化',
        severity: 'low',
        suggestion: '应增加务实考量，分析坚持理想的现实成本和替代方案',
      })
    }
  }

  // 检测6：与用户明确原则冲突
  for (const principle of vs.principles) {
    // 如果用户讲究"不占人便宜"，但回复建议占便宜
    if (principle.includes('不占') && principle.includes('便宜')) {
      if (/白嫖|占.*便宜|蹭.*免费|不用花钱/.test(replyContent)) {
        conflicts.push({
          type: 'principle_violation',
          description: `回复与用户原则"${principle}"冲突`,
          severity: 'high',
          suggestion: '应避免建议占便宜的行为',
        })
      }
    }
    // 如果用户讲究"帮人帮到底"，但回复建议半途而废
    if (principle.includes('帮人帮到底')) {
      if (/差不多就行了|别管了|随他去吧|放弃吧/.test(replyContent)) {
        conflicts.push({
          type: 'principle_violation',
          description: `回复与用户原则"${principle}"冲突`,
          severity: 'medium',
          suggestion: '应尊重用户帮到底的原则，或温和说明为何需要适时止损',
        })
      }
    }
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts,
  }
}
