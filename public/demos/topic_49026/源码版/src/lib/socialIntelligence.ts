/**
 * 社交智能引擎 — 中国式人情世故的工程化实现
 *
 * 理论根基：
 * - 《人物志》（刘劭）九征、八观、六情机、七谬
 * - 《乡土中国》（费孝通）差序格局
 * - 面子理论（Goffman + 胡先缙）
 * - 高语境文化（Hall）
 *
 * 三大核心引擎：
 * 1. 差序格局引擎 — 计算关系圈层，匹配沟通策略
 * 2. 面子评估引擎 — 评估回复面子风险，选择维护策略
 * 3. 人情账本引擎 — 追踪人情往来，提醒还人情债
 */

import type { Person, Memory } from '../types'

// ============================================================
// 一、差序格局引擎（费孝通《乡土中国》）
// ============================================================

/** 关系圈层 — 水波纹模型 */
export type SocialCircle =
  | 'core'         // 核心圈：配偶、父母、子女
  | 'intimate'     // 亲密圈：挚友、至交
  | 'familiar'     // 熟人圈：同事、普通朋友、邻居
  | 'instrumental' // 工具圈：领导、客户、下属
  | 'peripheral'   // 边缘圈：点头之交、陌生人

/** 圈层对应的沟通策略 */
export interface CircleStrategy {
  tone: string           // 语气基调
  directness: number     // 直接程度 0-1（1=最直接）
  faceSensitivity: number // 面子敏感度 0-1（1=最需注意）
  suggestionDepth: string // 建议深度
  tabooTopics: string[]  // 禁忌话题
}

/** 计算人物所处的关系圈层 */
export function calculateSocialCircle(person: Person): SocialCircle {
  const rel = person.relationship
  const sentiment = person.sentiment

  // 基础映射
  const baseMap: Record<string, SocialCircle> = {
    spouse: 'core',
    family: 'core',
    friend: 'familiar',
    colleague: 'familiar',
    leader: 'instrumental',
    subordinate: 'instrumental',
    client: 'instrumental',
    mentor: 'intimate',
    rival: 'peripheral',
    other: 'peripheral',
  }

  let circle = baseMap[rel] || 'peripheral'

  // 高温度朋友升级为亲密圈
  if (rel === 'friend' && sentiment >= 60) {
    circle = 'intimate'
  }
  // 低温度家人降级（关系疏远的家人）
  if (rel === 'family' && sentiment < 20) {
    circle = 'familiar'
  }
  // 高温度同事升级为亲密圈
  if (rel === 'colleague' && sentiment >= 70) {
    circle = 'intimate'
  }

  return circle
}

/** 获取圈层对应的沟通策略 */
export function getCircleStrategy(circle: SocialCircle): CircleStrategy {
  const strategies: Record<SocialCircle, CircleStrategy> = {
    core: {
      tone: '亲密随意，真诚关心',
      directness: 0.9,
      faceSensitivity: 0.2,
      suggestionDepth: '可深聊，直接指出问题',
      tabooTopics: [],
    },
    intimate: {
      tone: '真诚温暖，坦率但点到为止',
      directness: 0.7,
      faceSensitivity: 0.4,
      suggestionDepth: '可深聊，但注意方式',
      tabooTopics: ['对方配偶的坏话', '对方的收入'],
    },
    familiar: {
      tone: '客气有分寸，不越界',
      directness: 0.4,
      faceSensitivity: 0.7,
      suggestionDepth: '点到为止，只给方向',
      tabooTopics: ['对方私生活', '收入', '政治立场', '宗教'],
    },
    instrumental: {
      tone: '恭敬但不卑微，给面子',
      directness: 0.2,
      faceSensitivity: 0.9,
      suggestionDepth: '谨慎建议，先铺垫关系',
      tabooTopics: ['对方私生活', '收入', '公司内部政治', '对方决策的质疑'],
    },
    peripheral: {
      tone: '礼貌简洁，不深聊',
      directness: 0.3,
      faceSensitivity: 0.5,
      suggestionDepth: '不建议，只倾听',
      tabooTopics: ['私人信息', '家庭', '财务', '健康'],
    },
  }
  return strategies[circle]
}

// ============================================================
// 二、面子评估引擎（Goffman 面子理论 + 胡先缙）
// ============================================================

/** 面子风险等级 */
export type FaceRisk = 'none' | 'low' | 'medium' | 'high'

/** 面子维护策略 */
export type FaceStrategy =
  | 'direct'          // 直接说（核心圈家人）
  | 'gentle_hint'     // 委婉暗示（亲密圈）
  | 'sandwich'        // 三明治法（肯定-建议-肯定）
  | 'indirect'        // 间接表达（工具圈）
  | 'silent_support'  // 只倾听不建议（对方情绪激动时）

/** 批评性词汇模式 */
const CRITICAL_PATTERNS = /不对|不应该|错了|问题是|你总是|你从不|你怎么|你为什么|你到底|你看看你/

/** 命令性词汇模式 */
const COMMAND_PATTERNS = /你应该|你需要|你必须|你得|你最好|你要/

/** 空话安慰模式 */
const EMPTY_COMFORT_PATTERNS = /一切都会好的|没事的|别担心|会好起来的|想开点|别想太多|顺其自然/

/** 评估回复的面子风险 */
export function assessFaceRisk(
  replyContent: string,
  targetPerson: Person,
  userMessage: string
): FaceRisk {
  const circle = calculateSocialCircle(targetPerson)
  const strategy = getCircleStrategy(circle)

  // 基础风险分
  const baseRisk: Record<SocialCircle, number> = {
    core: 1, intimate: 2, familiar: 3, instrumental: 4, peripheral: 3
  }

  let riskScore = baseRisk[circle]

  // 批评性词汇增加风险
  if (CRITICAL_PATTERNS.test(replyContent)) {
    riskScore += 2
  }

  // 命令性词汇在工具圈/熟人圈增加风险
  if (COMMAND_PATTERNS.test(replyContent)) {
    riskScore += circle === 'instrumental' ? 3 : circle === 'familiar' ? 2 : 1
  }

  // 空话安慰增加风险（用户需要的是具体建议）
  if (EMPTY_COMFORT_PATTERNS.test(replyContent)) {
    riskScore += 1
  }

  // 对方情绪低落时增加风险
  if (/心情不好|难过|生气|失望|崩溃|受不了|撑不住|压力/.test(userMessage)) {
    riskScore += 1
  }

  // 涉及敏感话题（收入、职位、家庭矛盾）
  if (/收入|工资|多少钱|升职|降职|离婚|分手|出轨/.test(replyContent)) {
    riskScore += strategy.faceSensitivity > 0.7 ? 2 : 1
  }

  if (riskScore <= 2) return 'none'
  if (riskScore <= 4) return 'low'
  if (riskScore <= 6) return 'medium'
  return 'high'
}

/** 根据面子风险选择维护策略 */
export function selectFaceStrategy(
  risk: FaceRisk,
  circle: SocialCircle,
  userEmotion: string
): FaceStrategy {
  // 对方情绪激动时，先倾听不建议
  if (/生气|愤怒|崩溃|哭|受不了/.test(userEmotion)) {
    return 'silent_support'
  }

  if (risk === 'none') return 'direct'
  if (risk === 'low') return 'gentle_hint'

  // 中高风险根据圈层选择
  if (circle === 'core') return 'gentle_hint'
  if (circle === 'intimate') return 'sandwich'
  if (circle === 'familiar') return 'sandwich'
  if (circle === 'instrumental') return 'indirect'
  return 'indirect'
}

// ============================================================
// 三、人情账本引擎
// ============================================================

/** 人情类型 */
export type FavorType = 'received' | 'given'

/** 人情类别 */
export type FavorCategory =
  | 'material'      // 物质（礼物、借钱、请客）
  | 'introduction'  // 介绍（引荐人脉）
  | 'opportunity'   // 机会（工作机会、项目）
  | 'emotional'     // 情感（倾听、安慰、陪伴）
  | 'time'          // 时间（帮忙办事、跑腿）
  | 'information'   // 信息（提供关键信息）

/** 人情记录 */
export interface FavorRecord {
  personId: string
  personName: string
  type: FavorType
  category: FavorCategory
  description: string
  weight: number   // 1-10，人情大小
  date: string
  repaid: boolean  // 是否已还
}

/** 人情余额 */
export interface FavorBalance {
  personId: string
  personName: string
  balance: number  // 正=对方欠你，负=你欠对方
  lastFavorDate: string
  unrepaidCount: number
  suggestion: string
}

/** 从记忆中提取人情记录 */
export function extractFavorRecords(memories: Memory[], persons: Person[]): FavorRecord[] {
  const records: FavorRecord[] = []
  const personMap = new Map(persons.map(p => [p.name, p]))

  for (const mem of memories) {
    const content = mem.content

    // 检测"帮/送/请/介绍/借"等关键词 → received（收到人情）
    const receivedPatterns: Array<{ regex: RegExp; category: FavorCategory; weight: number }> = [
      { regex: /(帮|替)我.*(办|做|跑|买|送|找)/, category: 'time', weight: 3 },
      { regex: /送了.*(礼物|东西|特产|烟|酒|茶)/, category: 'material', weight: 4 },
      { regex: /请(我|我们).*(吃饭|喝|客)/, category: 'material', weight: 2 },
      { regex: /(借|垫).*(钱|款|费用)/, category: 'material', weight: 7 },
      { regex: /(介绍|引荐|推荐).*(认识|给|到)/, category: 'introduction', weight: 6 },
      { regex: /(给|提供|介绍).*(机会|项目|工作|职位)/, category: 'opportunity', weight: 8 },
      { regex: /(陪|听|安慰|开导)我/, category: 'emotional', weight: 3 },
      { regex: /(告诉|提醒|通知).*(消息|信息|消息)/, category: 'information', weight: 2 },
    ]

    // 检测"我帮/我送/我请"等关键词 → given（给出人情）
    const givenPatterns: Array<{ regex: RegExp; category: FavorCategory; weight: number }> = [
      { regex: /我(帮|替).*(他|她|他们).*(办|做|跑|买|送|找)/, category: 'time', weight: 3 },
      { regex: /我送了.*(他|她|他们)/, category: 'material', weight: 4 },
      { regex: /我请.*(他|她|他们).*(吃饭|喝|客)/, category: 'material', weight: 2 },
      { regex: /我(借|垫).*(钱|款|费用).*(给|到).*(他|她|他们)/, category: 'material', weight: 7 },
      { regex: /我(介绍|引荐|推荐).*(他|她|他们)/, category: 'introduction', weight: 6 },
    ]

    // 匹配收到的人情
    for (const pattern of receivedPatterns) {
      if (pattern.regex.test(content)) {
        // 找到涉及的人物
        for (const [name, person] of personMap) {
          if (content.includes(name)) {
            records.push({
              personId: person.id,
              personName: name,
              type: 'received',
              category: pattern.category,
              description: content.slice(0, 60),
              weight: pattern.weight,
              date: new Date(mem.createdAt).toISOString().split('T')[0],
              repaid: false,
            })
            break
          }
        }
        break
      }
    }

    // 匹配给出的人情
    for (const pattern of givenPatterns) {
      if (pattern.regex.test(content)) {
        for (const [name, person] of personMap) {
          if (content.includes(name)) {
            records.push({
              personId: person.id,
              personName: name,
              type: 'given',
              category: pattern.category,
              description: content.slice(0, 60),
              weight: pattern.weight,
              date: new Date(mem.createdAt).toISOString().split('T')[0],
              repaid: false,
            })
            break
          }
        }
        break
      }
    }
  }

  return records
}

/** 计算人情余额 */
export function calculateFavorBalance(records: FavorRecord[]): FavorBalance[] {
  const personMap = new Map<string, FavorRecord[]>()

  for (const record of records) {
    const list = personMap.get(record.personId) || []
    list.push(record)
    personMap.set(record.personId, list)
  }

  const balances: FavorBalance[] = []

  for (const [personId, list] of personMap) {
    let balance = 0
    let unrepaidCount = 0
    let lastDate = ''
    const personName = list[0]?.personName || ''

    for (const record of list) {
      const sign = record.type === 'received' ? -1 : 1 // 收到=我欠对方=负
      balance += sign * record.weight
      if (record.type === 'received' && !record.repaid) {
        unrepaidCount++
      }
      if (record.date > lastDate) lastDate = record.date
    }

    // 生成建议
    let suggestion = ''
    if (balance < -5) {
      suggestion = `你欠${personName}较大人情（${Math.abs(balance)}分），建议尽快找机会回报`
    } else if (balance <= -2) {
      suggestion = `你欠${personName}一些人情，可以适当回报`
    } else if (balance > 5) {
      suggestion = `${personName}欠你人情（${balance}分），不必急于讨还，但可适时提及`
    } else if (Math.abs(balance) < 2) {
      suggestion = `与${personName}的人情往来基本平衡`
    }

    balances.push({
      personId,
      personName,
      balance,
      lastFavorDate: lastDate,
      unrepaidCount,
      suggestion,
    })
  }

  // 按欠人情程度排序（最欠的排前面）
  balances.sort((a, b) => a.balance - b.balance)

  return balances
}

// ============================================================
// 四、《人物志》六情机引擎
// ============================================================

/** 六情机 — 人性六大情绪触发器 */
export const SIX_EMOTIONAL_TRIGGERS = {
  fulfill_desire: {
    name: '杼其所欲则喜',
    desc: '满足对方愿望，对方会高兴',
    positive: true,
  },
  suppress_ability: {
    name: '不杼其能则怨',
    desc: '压制对方能力，对方会埋怨',
    positive: false,
  },
  self_boasting: {
    name: '自伐历之则恶',
    desc: '在对方面前自夸，对方会讨厌',
    positive: false,
  },
  humble_to_other: {
    name: '谦损下之则悦',
    desc: '对对方谦让，对方会高兴',
    positive: true,
  },
  attack_weakness: {
    name: '驳其所乏则婟',
    desc: '攻击对方短处，对方会忌讳',
    positive: false,
  },
  strength_over_weakness: {
    name: '以恶犯婟则妒',
    desc: '以己之长压对方之短，对方会妒恨',
    positive: false,
  },
} as const

/** 检测回复中是否触发了负面情机 */
export function detectNegativeTriggers(replyContent: string): string[] {
  const triggered: string[] = []

  // 检测"自伐"（自夸）
  if (/我比|比你|比你强|我做得更好|我的优势|我从来不会/.test(replyContent)) {
    triggered.push('自伐历之则恶 — 回复中有自夸倾向，对方可能讨厌')
  }

  // 检测"驳其所乏"（攻击短处）
  if (/你总是|你从不|你又|你每次都|你怎么老/.test(replyContent)) {
    triggered.push('驳其所乏则婟 — 攻击对方短处，对方会忌讳')
  }

  // 检测"以长压短"
  if (/我都能|我都可以|别人都|你应该像我/.test(replyContent)) {
    triggered.push('以恶犯婟则妒 — 以己之长压对方之短，对方会妒恨')
  }

  // 检测"压制能力"
  if (/你不行|你做不到|你做不了|你没这个能力/.test(replyContent)) {
    triggered.push('不杼其能则怨 — 压制对方能力，对方会埋怨')
  }

  return triggered
}

// ============================================================
// 五、高语境理解引擎
// ============================================================

/** 高语境词汇→真实含义映射 */
const HIGH_CONTEXT_MAP: Array<{ pattern: RegExp; meaning: string; type: 'refusal' | 'hesitation' | 'approval' | 'concern' | 'passive_aggressive' | 'workplace' }> = [
  // 婉拒类
  { pattern: /改天/, meaning: '通常是婉拒，不要追问"改哪天"', type: 'refusal' },
  { pattern: /再说吧/, meaning: '通常是拒绝，不要反复提', type: 'refusal' },
  { pattern: /下次吧/, meaning: '通常是拒绝，不是真的有下次', type: 'refusal' },
  { pattern: /有空再说/, meaning: '婉拒，不要等对方主动联系', type: 'refusal' },
  { pattern: /到时候看/, meaning: '不承诺，大概率不行', type: 'refusal' },
  { pattern: /研究研究/, meaning: '通常意味着拒绝或拖延', type: 'refusal' },
  { pattern: /考虑考虑/, meaning: '通常是委婉拒绝', type: 'refusal' },
  { pattern: /有机会再说/, meaning: '客套话，不是真的有计划', type: 'refusal' },
  // 犹豫类
  { pattern: /我看看/, meaning: '不一定能办到，不要抱太大期望', type: 'hesitation' },
  { pattern: /尽量吧/, meaning: '不一定能做到，对方没把握', type: 'hesitation' },
  { pattern: /我想想/, meaning: '犹豫中，大概率倾向拒绝', type: 'hesitation' },
  { pattern: /这个事情嘛/, meaning: '犹豫，后面通常跟转折', type: 'hesitation' },
  // 认可类
  { pattern: /还行/, meaning: '在中国语境下是不错的评价，不是敷衍', type: 'approval' },
  { pattern: /还可以/, meaning: '比"还行"稍好，是正面评价', type: 'approval' },
  { pattern: /过得去/, meaning: '基本满意，但不是很高', type: 'approval' },
  // 关切类（表面没事实际有事）
  { pattern: /没事/, meaning: '可能恰恰有事，需要主动关心', type: 'concern' },
  { pattern: /随便/, meaning: '可能并不随便，只是不想争', type: 'concern' },
  { pattern: /不用了/, meaning: '可能只是客气，并非真的不需要', type: 'concern' },
  { pattern: /都行/, meaning: '可能有偏好但选择迁就', type: 'concern' },
  { pattern: /不急/, meaning: '可能其实急，只是不想催', type: 'concern' },
  // 被动攻击类
  { pattern: /随你便/, meaning: '不高兴了，不是真的让你随意', type: 'passive_aggressive' },
  { pattern: /无所谓/, meaning: '可能很在意但不想表达', type: 'passive_aggressive' },
  { pattern: /算了吧/, meaning: '失望或放弃，不是真的无所谓', type: 'passive_aggressive' },
  { pattern: /你定就行/, meaning: '在测试你是否考虑对方感受', type: 'passive_aggressive' },
  { pattern: /我睡了/, meaning: '可能情绪不好，不是真的要睡觉', type: 'passive_aggressive' },
  { pattern: /别管我/, meaning: '实际希望被关注和安慰', type: 'passive_aggressive' },
  { pattern: /哦/, meaning: '单独一个"哦"可能是不耐烦或敷衍', type: 'passive_aggressive' },
  // 职场类
  { pattern: /原则上可以/, meaning: '实际上可能不行，有但书', type: 'workplace' },
  { pattern: /基本上没问题/, meaning: '还有问题没解决', type: 'workplace' },
  { pattern: /我去跟领导说说/, meaning: '不一定真去说，可能拖延', type: 'workplace' },
  { pattern: /这个我再想想/, meaning: '不太想答应，委婉拒绝', type: 'workplace' },
]

/** 检测用户消息中的高语境信号 */
export function detectHighContextSignals(userMessage: string): Array<{ word: string; meaning: string; type: string }> {
  const signals: Array<{ word: string; meaning: string; type: string }> = []

  for (const item of HIGH_CONTEXT_MAP) {
    if (item.pattern.test(userMessage)) {
      const match = userMessage.match(item.pattern)
      if (match) {
        signals.push({
          word: match[0],
          meaning: item.meaning,
          type: item.type,
        })
      }
    }
  }

  return signals
}

// ============================================================
// 六、社交智能上下文生成器
// ============================================================

/** 生成社交智能上下文（注入到系统提示词） */
export function buildSocialIntelligenceContext(
  targetPerson: Person | undefined,
  userMessage: string,
  memories: Memory[]
): string {
  const parts: string[] = []

  // 1. 差序格局分析
  if (targetPerson) {
    const circle = calculateSocialCircle(targetPerson)
    const strategy = getCircleStrategy(circle)

    parts.push(`【社交智能·差序格局】`)
    parts.push(`${targetPerson.name} 处于你的「${circleLabel(circle)}」`)
    parts.push(`沟通策略：${strategy.tone}`)
    parts.push(`直接程度：${Math.round(strategy.directness * 100)}%，面子敏感度：${Math.round(strategy.faceSensitivity * 100)}%`)
    parts.push(`建议深度：${strategy.suggestionDepth}`)
    if (strategy.tabooTopics.length > 0) {
      parts.push(`避免话题：${strategy.tabooTopics.join('、')}`)
    }
  }

  // 2. 高语境信号检测
  const signals = detectHighContextSignals(userMessage)
  if (signals.length > 0) {
    parts.push(`\n【高语境信号】`)
    for (const sig of signals) {
      parts.push(`- "${sig.word}" — ${sig.meaning}`)
    }
  }

  // 3. 六情机检测
  const negativeTriggers = detectNegativeTriggers(userMessage)
  if (negativeTriggers.length > 0) {
    parts.push(`\n【六情机警示】`)
    for (const trigger of negativeTriggers) {
      parts.push(`- ${trigger}`)
    }
  }

  // 4. 人情账本
  if (targetPerson && memories.length > 0) {
    const favorRecords = extractFavorRecords(memories, [targetPerson])
    if (favorRecords.length > 0) {
      const balances = calculateFavorBalance(favorRecords)
      const balance = balances.find(b => b.personId === targetPerson.id)
      if (balance && balance.suggestion) {
        parts.push(`\n【人情账本】`)
        parts.push(balance.suggestion)
      }
    }
  }

  return parts.length > 0 ? parts.join('\n') : ''
}

/** 圈层中文标签 */
function circleLabel(circle: SocialCircle): string {
  const labels: Record<SocialCircle, string> = {
    core: '核心圈·家人',
    intimate: '亲密圈·挚友',
    familiar: '熟人圈·同事朋友',
    instrumental: '工具圈·领导客户',
    peripheral: '边缘圈·点头之交',
  }
  return labels[circle]
}
