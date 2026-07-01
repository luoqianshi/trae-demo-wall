// ============================================================
// 人情世故引擎 — 基于 AI 动态生成的人情世故分析
// 衡舟核心差异化能力：不硬编码规则，基于用户人物关系数据动态生成建议
// ============================================================

import { safeChat } from './ai'
import { useDataStore } from '../stores/useDataStore'
import { getUserProfileObject } from './prompts'
import type { Person, Memory } from '../types'

// ============================================================
// 类型定义
// ============================================================

/** 节日礼仪建议 */
export interface EtiquetteSuggestion {
  /** 节日名称 */
  festival: string
  /** 节日日期 */
  festivalDate: string
  /** 距今天数 */
  daysUntil: number
  /** 相关人物姓名 */
  personName: string
  /** 关系类型 */
  relationship: string
  /** 礼物建议 */
  giftSuggestion: string
  /** 问候语建议 */
  greetingSuggestion: string
  /** 建议理由 */
  reason: string
  /** 优先级 */
  priority: 'high' | 'medium' | 'low'
}

/** 人情往来单项 */
export interface SocialDebtItem {
  /** 人物姓名 */
  personName: string
  /** 关系类型 */
  relationship: string
  /** 人情类型 */
  debtType: 'owe-them' | 'they-owe-me' | 'balanced'
  /** 人情描述 */
  description: string
  /** 记忆依据 */
  evidence: string
  /** 建议行动 */
  suggestedAction: string
  /** 紧急程度 */
  urgency: 'high' | 'medium' | 'low'
}

/** 人情往来分析 */
export interface SocialDebtAnalysis {
  /** 人情往来明细 */
  items: SocialDebtItem[]
  /** 整体平衡度分析 */
  summary: string
  /** 平衡度分数 -100~100 */
  balanceScore: number
  /** AI 模式 */
  mode: 'live' | 'demo'
}

/** 关系维护建议 */
export interface MaintenanceSuggestion {
  /** 人物姓名 */
  personName: string
  /** 关系类型 */
  relationship: string
  /** 当前温度 0-100 */
  currentTemperature: number
  /** 之前温度 0-100 */
  previousTemperature: number
  /** 趋势 */
  trend: 'rising' | 'stable' | 'declining'
  /** 距上次互动天数 */
  daysSinceLastInteraction: number
  /** 维护建议 */
  suggestion: string
  /** 建议行动 */
  suggestedAction: string
  /** 优先级 */
  priority: 'high' | 'medium' | 'low'
}

/** 社交场景分析 */
export interface SceneAnalysis {
  /** 场景描述 */
  scene: string
  /** 座次安排建议 */
  seatingArrangement: string
  /** 矛盾提醒（谁和谁不宜同桌） */
  conflicts: string[]
  /** 安全话题 */
  safeTopics: string[]
  /** 禁忌话题 */
  forbiddenTopics: string[]
  /** 礼物建议 */
  giftSuggestions: string[]
  /** 综合建议 */
  overallAdvice: string
  /** AI 模式 */
  mode: 'live' | 'demo'
}

/** 关系温度预警 */
export interface RelationshipAlert {
  /** 人物姓名 */
  personName: string
  /** 关系类型 */
  relationship: string
  /** 当前温度 0-100 */
  currentTemperature: number
  /** 下降幅度 */
  declineAmount: number
  /** 下降原因分析 */
  declineReason: string
  /** 风险等级 */
  riskLevel: 'high' | 'medium' | 'low'
  /** 修复建议 */
  repairSuggestion: string
}

/** 综合人情世故报告 */
export interface EtiquetteReport {
  /** 节日礼仪建议 */
  festivals: EtiquetteSuggestion[]
  /** 人情往来分析 */
  socialDebt: SocialDebtAnalysis
  /** 关系维护建议 */
  maintenance: MaintenanceSuggestion[]
  /** 关系温度预警 */
  alerts: RelationshipAlert[]
  /** 生成时间 */
  generatedAt: number
  /** AI 模式 */
  mode: 'live' | 'demo'
}

// ============================================================
// 节日数据库
// ============================================================

interface FestivalInfo {
  name: string
  date: string // YYYY-MM-DD
  type: 'lunar' | 'solar-term' | 'modern'
  description: string
}

// 农历节日硬编码日期（2025-2028）
const LUNAR_FESTIVALS: FestivalInfo[] = [
  // 2025
  { name: '春节', date: '2025-01-29', type: 'lunar', description: '农历新年，最重要的传统节日' },
  { name: '元宵节', date: '2025-02-12', type: 'lunar', description: '正月十五，赏花灯、吃元宵' },
  { name: '端午节', date: '2025-05-31', type: 'lunar', description: '五月初五，吃粽子、赛龙舟' },
  { name: '七夕节', date: '2025-08-29', type: 'lunar', description: '七月初七，中国情人节' },
  { name: '中秋节', date: '2025-10-06', type: 'lunar', description: '八月十五，赏月、吃月饼' },
  { name: '重阳节', date: '2025-10-29', type: 'lunar', description: '九月初九，敬老节' },
  { name: '腊八节', date: '2025-12-28', type: 'lunar', description: '腊月初八，喝腊八粥' },
  // 2026
  { name: '春节', date: '2026-02-17', type: 'lunar', description: '农历新年，最重要的传统节日' },
  { name: '元宵节', date: '2026-03-03', type: 'lunar', description: '正月十五，赏花灯、吃元宵' },
  { name: '端午节', date: '2026-06-19', type: 'lunar', description: '五月初五，吃粽子、赛龙舟' },
  { name: '七夕节', date: '2026-08-19', type: 'lunar', description: '七月初七，中国情人节' },
  { name: '中秋节', date: '2026-09-25', type: 'lunar', description: '八月十五，赏月、吃月饼' },
  { name: '重阳节', date: '2026-10-18', type: 'lunar', description: '九月初九，敬老节' },
  { name: '腊八节', date: '2026-12-28', type: 'lunar', description: '腊月初八，喝腊八粥' },
  // 2027
  { name: '春节', date: '2027-02-06', type: 'lunar', description: '农历新年，最重要的传统节日' },
  { name: '元宵节', date: '2027-02-20', type: 'lunar', description: '正月十五，赏花灯、吃元宵' },
  { name: '端午节', date: '2027-06-09', type: 'lunar', description: '五月初五，吃粽子、赛龙舟' },
  { name: '七夕节', date: '2027-08-08', type: 'lunar', description: '七月初七，中国情人节' },
  { name: '中秋节', date: '2027-09-15', type: 'lunar', description: '八月十五，赏月、吃月饼' },
  { name: '重阳节', date: '2027-10-08', type: 'lunar', description: '九月初九，敬老节' },
  { name: '腊八节', date: '2027-12-30', type: 'lunar', description: '腊月初八，喝腊八粥' },
  // 2028
  { name: '春节', date: '2028-01-26', type: 'lunar', description: '农历新年，最重要的传统节日' },
  { name: '元宵节', date: '2028-02-09', type: 'lunar', description: '正月十五，赏花灯、吃元宵' },
  { name: '端午节', date: '2028-05-28', type: 'lunar', description: '五月初五，吃粽子、赛龙舟' },
  { name: '七夕节', date: '2028-07-28', type: 'lunar', description: '七月初七，中国情人节' },
  { name: '中秋节', date: '2028-09-03', type: 'lunar', description: '八月十五，赏月、吃月饼' },
  { name: '重阳节', date: '2028-09-26', type: 'lunar', description: '九月初九，敬老节' },
  { name: '腊八节', date: '2028-12-19', type: 'lunar', description: '腊月初八，喝腊八粥' },
]

// 二十四节气（近似日期，每年浮动1-2天）
const SOLAR_TERM_DATA: { name: string; month: number; day: number; description: string }[] = [
  { name: '小寒', month: 1, day: 6, description: '天气渐寒' },
  { name: '大寒', month: 1, day: 20, description: '一年最冷' },
  { name: '立春', month: 2, day: 4, description: '春季开始' },
  { name: '雨水', month: 2, day: 19, description: '降雨开始' },
  { name: '惊蛰', month: 3, day: 6, description: '春雷始鸣' },
  { name: '春分', month: 3, day: 21, description: '昼夜平分' },
  { name: '清明', month: 4, day: 5, description: '扫墓祭祖' },
  { name: '谷雨', month: 4, day: 20, description: '雨生百谷' },
  { name: '立夏', month: 5, day: 6, description: '夏季开始' },
  { name: '小满', month: 5, day: 21, description: '麦粒渐满' },
  { name: '芒种', month: 6, day: 6, description: '播种时节' },
  { name: '夏至', month: 6, day: 21, description: '白昼最长' },
  { name: '小暑', month: 7, day: 7, description: '天气炎热' },
  { name: '大暑', month: 7, day: 23, description: '一年最热' },
  { name: '立秋', month: 8, day: 8, description: '秋季开始' },
  { name: '处暑', month: 8, day: 23, description: '暑气渐消' },
  { name: '白露', month: 9, day: 8, description: '露凝而白' },
  { name: '秋分', month: 9, day: 23, description: '昼夜平分' },
  { name: '寒露', month: 10, day: 8, description: '露气寒冷' },
  { name: '霜降', month: 10, day: 23, description: '初霜出现' },
  { name: '立冬', month: 11, day: 7, description: '冬季开始' },
  { name: '小雪', month: 11, day: 22, description: '开始降雪' },
  { name: '大雪', month: 12, day: 7, description: '雪量增多' },
  { name: '冬至', month: 12, day: 22, description: '白昼最短，吃饺子' },
]

// 现代节日（固定公历日期）
const MODERN_FESTIVAL_DATA: { name: string; month: number; day: number; description: string }[] = [
  { name: '元旦', month: 1, day: 1, description: '新年第一天' },
  { name: '情人节', month: 2, day: 14, description: '西方情人节' },
  { name: '妇女节', month: 3, day: 8, description: '国际妇女节' },
  { name: '劳动节', month: 5, day: 1, description: '国际劳动节' },
  { name: '青年节', month: 5, day: 4, description: '五四青年节' },
  { name: '儿童节', month: 6, day: 1, description: '国际儿童节' },
  { name: '建党节', month: 7, day: 1, description: '中国共产党成立纪念日' },
  { name: '建军节', month: 8, day: 1, description: '中国人民解放军建军节' },
  { name: '教师节', month: 9, day: 10, description: '感谢师恩' },
  { name: '国庆节', month: 10, day: 1, description: '中华人民共和国国庆日' },
  { name: '圣诞节', month: 12, day: 25, description: '西方圣诞节' },
]

/** 计算某年某月的第 N 个星期X的日期 */
function nthWeekdayOfMonth(year: number, month: number, weekday: number, n: number): number {
  const firstDay = new Date(year, month - 1, 1)
  const firstWeekday = firstDay.getDay()
  let day = 1 + ((weekday - firstWeekday + 7) % 7) + (n - 1) * 7
  // 验证日期有效
  const testDate = new Date(year, month - 1, day)
  if (testDate.getMonth() !== month - 1) {
    return -1
  }
  return day
}

/** 生成变日期节日（母亲节、父亲节、感恩节） */
function getVariableFestivals(year: number): FestivalInfo[] {
  const result: FestivalInfo[] = []
  // 母亲节：5月第二个周日
  const motherDay = nthWeekdayOfMonth(year, 5, 0, 2)
  if (motherDay > 0) {
    result.push({
      name: '母亲节',
      date: `${year}-${String(5).padStart(2, '0')}-${String(motherDay).padStart(2, '0')}`,
      type: 'modern',
      description: '感谢母亲',
    })
  }
  // 父亲节：6月第三个周日
  const fatherDay = nthWeekdayOfMonth(year, 6, 0, 3)
  if (fatherDay > 0) {
    result.push({
      name: '父亲节',
      date: `${year}-${String(6).padStart(2, '0')}-${String(fatherDay).padStart(2, '0')}`,
      type: 'modern',
      description: '感谢父亲',
    })
  }
  // 感恩节：11月第四个周四
  const thanksgivingDay = nthWeekdayOfMonth(year, 11, 4, 4)
  if (thanksgivingDay > 0) {
    result.push({
      name: '感恩节',
      date: `${year}-${String(11).padStart(2, '0')}-${String(thanksgivingDay).padStart(2, '0')}`,
      type: 'modern',
      description: '感恩身边的人',
    })
  }
  return result
}

/** 获取所有节日列表（含农历、节气、现代节日） */
function getAllFestivals(): FestivalInfo[] {
  const now = new Date()
  const currentYear = now.getFullYear()
  const allFestivals: FestivalInfo[] = []

  // 农历节日（已含硬编码日期）
  allFestivals.push(...LUNAR_FESTIVALS)

  // 为当前年份和下一年的节气、现代节日生成日期
  for (const year of [currentYear - 1, currentYear, currentYear + 1]) {
    // 节气
    for (const term of SOLAR_TERM_DATA) {
      allFestivals.push({
        name: term.name,
        date: `${year}-${String(term.month).padStart(2, '0')}-${String(term.day).padStart(2, '0')}`,
        type: 'solar-term',
        description: term.description,
      })
    }
    // 现代节日
    for (const fest of MODERN_FESTIVAL_DATA) {
      allFestivals.push({
        name: fest.name,
        date: `${year}-${String(fest.month).padStart(2, '0')}-${String(fest.day).padStart(2, '0')}`,
        type: 'modern',
        description: fest.description,
      })
    }
    // 变日期节日
    allFestivals.push(...getVariableFestivals(year))
  }

  return allFestivals
}

/** 获取即将到来的节日 */
export function getUpcomingFestivals(daysAhead: number): FestivalInfo[] {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const allFestivals = getAllFestivals()

  const upcoming = allFestivals
    .filter((f) => {
      const festDate = new Date(f.date)
      festDate.setHours(0, 0, 0, 0)
      const diffDays = Math.floor((festDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return diffDays >= 0 && diffDays <= daysAhead
    })
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return dateA - dateB
    })

  // 去重：同一天同名的节日只保留一个
  const seen = new Set<string>()
  return upcoming.filter((f) => {
    const key = `${f.name}-${f.date}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/** 计算距今天数 */
function getDaysUntil(dateStr: string): number {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.floor((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

// ============================================================
// 辅助函数
// ============================================================

/** 关系类型中文标签 */
const RELATIONSHIP_LABELS: Record<string, string> = {
  spouse: '配偶',
  family: '家人',
  colleague: '同事',
  friend: '朋友',
  leader: '领导',
  mentor: '导师',
  subordinate: '下属',
  client: '客户',
  rival: '竞争对手',
  other: '其他',
}

/** sentiment 已是 0~100 范围，直接作为温度值使用 */
function sentimentToTemperature(sentiment: number): number {
  return Math.max(0, Math.min(100, Math.round(sentiment)))
}

/** 计算距上次互动天数 */
function getDaysSinceLastInteraction(person: Person): number {
  const lastInteraction = person.interactionStats?.lastInteractionAt || person.updatedAt
  return Math.floor((Date.now() - lastInteraction) / (1000 * 60 * 60 * 24))
}

/** 格式化人物信息用于 AI 分析（聚焦人情世故维度） */
function formatPersonForEtiquette(person: Person): string {
  const lines: string[] = []
  const temp = sentimentToTemperature(person.sentiment)
  const relLabel = RELATIONSHIP_LABELS[person.relationship] || person.relationship
  lines.push(`【${person.name}】关系：${relLabel}，温度：${temp}/100`)

  // 身份信息
  const identity = person.profile?.identity
  if (identity) {
    const parts: string[] = []
    if (identity.age) parts.push(`${identity.age}岁`)
    if (identity.gender === 'male') parts.push('男')
    else if (identity.gender === 'female') parts.push('女')
    if (identity.birthday) parts.push(`生日${identity.birthday}`)
    if (identity.hometown) parts.push(`${identity.hometown}人`)
    if (identity.currentCity) parts.push(`现居${identity.currentCity}`)
    if (parts.length > 0) lines.push(`  基本信息：${parts.join('，')}`)
  }

  // 职业信息
  const career = person.profile?.career
  if (career) {
    const parts: string[] = []
    if (career.company) parts.push(career.company)
    if (career.title) parts.push(career.title)
    if (parts.length > 0) lines.push(`  职业：${parts.join(' ')}`)
  }

  // 偏好（送礼关键信息）
  const pref = person.profile?.preferences
  if (pref) {
    if (pref.likes && pref.likes.length > 0) lines.push(`  喜好：${pref.likes.join('、')}`)
    if (pref.dislikes && pref.dislikes.length > 0) lines.push(`  反感：${pref.dislikes.join('、')}`)
    if (pref.allergies && pref.allergies.length > 0) lines.push(`  过敏：${pref.allergies.join('、')}`)
    if (pref.dietary && pref.dietary.length > 0) lines.push(`  饮食：${pref.dietary.join('、')}`)
    if (pref.hobbies && pref.hobbies.length > 0) lines.push(`  爱好：${pref.hobbies.join('、')}`)
    if (pref.communicationStyle) lines.push(`  沟通风格：${pref.communicationStyle}`)
  }

  // 价值观与担忧
  const val = person.profile?.values
  if (val) {
    if (val.fears && val.fears.length > 0) lines.push(`  担忧：${val.fears.join('、')}`)
    if (val.goals && val.goals.length > 0) lines.push(`  目标：${val.goals.join('、')}`)
  }

  // 社交角色
  const role = person.profile?.socialRole
  if (role) {
    if (role.roleInMyLife) lines.push(`  在我生活中：${role.roleInMyLife}`)
    lines.push(`  信任度：${role.trustLevel}/100，亲密度：${role.intimacyLevel}/100`)
  }

  // 互动统计
  const daysSince = getDaysSinceLastInteraction(person)
  lines.push(`  最后互动：${daysSince}天前，互动次数：${person.interactionStats?.totalCount || 0}`)

  // 关系温度趋势
  if (person.sentimentHistory && person.sentimentHistory.length >= 2) {
    const history = person.sentimentHistory
    const latest = history[history.length - 1]
    const previous = history[history.length - 2]
    const trend = latest.value > previous.value ? '上升' : latest.value < previous.value ? '下降' : '平稳'
    lines.push(`  温度趋势：${trend}（${previous.value}→${latest.value}），原因：${latest.reason}`)
  }

  // 关系网络
  if (person.connections && person.connections.length > 0) {
    lines.push(`  关系网络：${person.connections.map((c) => `${c.targetPersonName}(${c.relationType})`).join('、')}`)
  }

  return lines.join('\n')
}

/** 格式化记忆列表用于 AI 分析 */
function formatMemoriesForAI(memories: Memory[], maxCount: number = 30): string {
  if (!memories || memories.length === 0) return '暂无记忆记录'
  const sorted = [...memories].sort((a, b) => b.createdAt - a.createdAt)
  return sorted
    .slice(0, maxCount)
    .map((m) => {
      const conf = m.confidence === 'high' ? '已确认' : m.confidence === 'medium' ? '待确认' : '低置信'
      const date = new Date(m.createdAt).toLocaleDateString('zh-CN')
      return `- [${conf}|${date}] ${m.content}`
    })
    .join('\n')
}

/** 从记忆中提取与人情往来相关的记忆 */
function extractSocialDebtMemories(memories: Memory[]): Memory[] {
  const keywords = [
    '帮忙', '帮了', '帮过', '欠', '还', '人情', '送礼', '收到', '请客',
    '借', '还钱', '感谢', '谢', '恩', '照顾', '关照', '引荐', '推荐',
    '托', '托人', '办事', '帮忙办', '承蒙', '受', '馈赠', '回礼', '答谢',
  ]
  return memories.filter((m) => {
    const content = m.content.toLowerCase()
    return keywords.some((kw) => content.includes(kw))
  })
}

/** 从记忆中提取与关系变化相关的记忆 */
function extractRelationshipMemories(memories: Memory[]): Memory[] {
  const keywords = [
    '吵架', '冲突', '矛盾', '生气', '冷战', '和好', '道歉', '原谅',
    '开心', '高兴', '失望', '难过', '感动', '感谢', '信任', '背叛',
    '见面', '聚会', '吃饭', '约', '联系', '打电话', '聊天', '互动',
  ]
  return memories.filter((m) => {
    const content = m.content.toLowerCase()
    return keywords.some((kw) => content.includes(kw))
  })
}

/** 健壮的 JSON 解析：处理 markdown 代码块、多余文本等 */
function parseJsonResponse<T>(text: string): T | null {
  if (!text || !text.trim()) return null

  let cleaned = text.trim()

  // 移除 markdown 代码块标记
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim()
  }

  // 尝试直接解析
  try {
    return JSON.parse(cleaned) as T
  } catch {
    // 继续尝试
  }

  // 尝试提取 JSON 数组
  const arrayMatch = cleaned.match(/\[[\s\S]*\]/)
  if (arrayMatch) {
    try {
      return JSON.parse(arrayMatch[0]) as T
    } catch {
      // 继续尝试
    }
  }

  // 尝试提取 JSON 对象
  const objectMatch = cleaned.match(/\{[\s\S]*\}/)
  if (objectMatch) {
    try {
      return JSON.parse(objectMatch[0]) as T
    } catch {
      // 继续尝试
    }
  }

  console.warn('[socialEtiquette] JSON 解析失败，原始文本:', text.slice(0, 200))
  return null
}

/** 获取用户画像摘要 */
function getUserProfileSummary(): string {
  try {
    const profile = getUserProfileObject()
    const parts: string[] = []
    parts.push(`姓名：${profile.name || '未填写'}`)
    if (profile.age) parts.push(`${profile.age}岁`)
    if (profile.gender === 'male') parts.push('男')
    else if (profile.gender === 'female') parts.push('女')
    if (profile.city) parts.push(`现居${profile.city}`)
    if (profile.occupation) parts.push(`职业：${profile.occupation}`)
    if (profile.family) parts.push(`家庭：${profile.family}`)
    return parts.join('，')
  } catch {
    return '用户画像未设置'
  }
}

/** 获取当前数据 */
function getCurrentData(): { persons: Person[]; memories: Memory[] } {
  const state = useDataStore.getState()
  return {
    persons: state.persons || [],
    memories: state.memories || [],
  }
}

// ============================================================
// AI Prompt 构建
// ============================================================

function buildFestivalPrompt(
  personsData: string,
  festivalsData: string,
  memoriesData: string,
  userProfile: string
): Array<{ role: 'system' | 'user'; content: string }> {
  return [
    {
      role: 'system',
      content: `你是衡舟的人情世故顾问，精通中国传统节日礼仪和人情往来。你的任务是根据用户的人物关系数据，为即将到来的节日生成个性化的送礼和问候建议。

【核心原则】
1. 所有建议必须基于用户已有的人物关系数据，不能凭空编造人物
2. 结合每个人的身份、关系、偏好、温度给出差异化建议
3. 礼物建议要具体可执行，考虑对方的喜好、过敏、饮食禁忌
4. 问候语要贴合关系亲疏和节日氛围
5. 优先级：关系温度高且互动少的人优先，重要关系（家人/领导）优先

【输出要求】
输出严格的 JSON 数组，每个元素包含：
{
  "festival": "节日名称",
  "festivalDate": "节日日期 YYYY-MM-DD",
  "daysUntil": 距今天数,
  "personName": "人物姓名（必须是用户已有的人物）",
  "relationship": "关系类型",
  "giftSuggestion": "具体礼物建议",
  "greetingSuggestion": "问候语建议",
  "reason": "为什么这样建议",
  "priority": "high|medium|low"
}

只输出 JSON 数组，不要包含任何其他文字。如果没有需要建议的人物，返回空数组 []。`,
    },
    {
      role: 'user',
      content: `【用户画像】
${userProfile}

【当前日期】
${new Date().toLocaleDateString('zh-CN')}（${new Date().toLocaleDateString('zh-CN', { weekday: 'long' })}）

【即将到来的节日】
${festivalsData}

【用户的人物关系档案】
${personsData}

【相关记忆】
${memoriesData}

请基于以上信息，为每个即将到来的节日和每位相关人物生成个性化的节日礼仪建议。重点关注：家人、领导、重要客户、导师等关键关系。`,
    },
  ]
}

function buildSocialDebtPrompt(
  personsData: string,
  debtMemoriesData: string,
  userProfile: string
): Array<{ role: 'system' | 'user'; content: string }> {
  return [
    {
      role: 'system',
      content: `你是衡舟的人情往来分析师，精通中国人情社会的"欠人情"与"还人情"逻辑。你的任务是从用户的记忆中分析人情往来的平衡度，提醒该还的人情。

【核心原则】
1. 从记忆中识别"谁帮过用户""用户欠谁的人情""谁欠用户的人情"
2. 分析人情往来的平衡度，指出需要还的人情
3. 建议要具体可执行，考虑关系亲疏和人情大小
4. 所有分析必须基于用户已有的记忆数据，不能凭空编造

【输出要求】
输出严格的 JSON 对象：
{
  "items": [
    {
      "personName": "人物姓名",
      "relationship": "关系类型",
      "debtType": "owe-them|they-owe-me|balanced",
      "description": "人情描述",
      "evidence": "记忆依据",
      "suggestedAction": "建议行动",
      "urgency": "high|medium|low"
    }
  ],
  "summary": "整体人情往来平衡度分析",
  "balanceScore": -100到100的整数
}

balanceScore 含义：负数表示用户欠别人较多，正数表示别人欠用户较多，0表示平衡。
只输出 JSON 对象，不要包含任何其他文字。`,
    },
    {
      role: 'user',
      content: `【用户画像】
${userProfile}

【用户的人物关系档案】
${personsData}

【与人情往来相关的记忆】
${debtMemoriesData}

请分析用户的人情往来状况，指出该还的人情和需要主动维护的关系。`,
    },
  ]
}

function buildMaintenancePrompt(
  personsData: string,
  relationshipMemoriesData: string,
  userProfile: string
): Array<{ role: 'system' | 'user'; content: string }> {
  return [
    {
      role: 'system',
      content: `你是衡舟的关系维护顾问。你的任务是根据各人物的最后互动时间、关系温度变化趋势，生成个性化的关系维护建议。

【核心原则】
1. 重点关注：长时间未互动的关系、温度下降的关系、重要但疏远的关系
2. 建议要具体可执行（如"约一次饭""打个电话""发个消息"）
3. 结合对方的沟通风格和偏好给出建议
4. 所有建议必须基于用户已有的人物关系数据

【输出要求】
输出严格的 JSON 数组，每个元素包含：
{
  "personName": "人物姓名",
  "relationship": "关系类型",
  "currentTemperature": 当前温度0-100,
  "previousTemperature": 之前温度0-100,
  "trend": "rising|stable|declining",
  "daysSinceLastInteraction": 距上次互动天数,
  "suggestion": "维护建议",
  "suggestedAction": "具体行动",
  "priority": "high|medium|low"
}

只输出 JSON 数组，不要包含任何其他文字。如果所有关系都健康，返回空数组 []。`,
    },
    {
      role: 'user',
      content: `【用户画像】
${userProfile}

【用户的人物关系档案（含温度趋势和互动统计）】
${personsData}

【与关系变化相关的记忆】
${relationshipMemoriesData}

请分析各关系的维护状况，为需要维护的关系生成个性化建议。重点关注3个月以上未互动、温度下降、或重要但疏远的关系。`,
    },
  ]
}

function buildSceneAnalysisPrompt(
  scene: string,
  personsData: string,
  memoriesData: string,
  userProfile: string
): Array<{ role: 'system' | 'user'; content: string }> {
  return [
    {
      role: 'system',
      content: `你是衡舟的社交场景分析师，精通中国社交礼仪。你的任务是根据用户的人物关系网络，分析特定社交场景下的应对策略。

【核心原则】
1. 基于用户已有的人物关系数据进行分析
2. 座次安排要考虑权力关系、辈分、关系亲疏
3. 话题建议要结合各人物的偏好、反感、价值观
4. 矛盾提醒要基于关系网络中的潜在冲突
5. 所有分析必须基于用户已有的人物关系数据

【输出要求】
输出严格的 JSON 对象：
{
  "scene": "场景描述",
  "seatingArrangement": "座次安排建议",
  "conflicts": ["矛盾提醒1", "矛盾提醒2"],
  "safeTopics": ["安全话题1", "安全话题2"],
  "forbiddenTopics": ["禁忌话题1", "禁忌话题2"],
  "giftSuggestions": ["礼物建议1", "礼物建议2"],
  "overallAdvice": "综合建议"
}

只输出 JSON 对象，不要包含任何其他文字。`,
    },
    {
      role: 'user',
      content: `【用户画像】
${userProfile}

【用户的人物关系档案】
${personsData}

【相关记忆】
${memoriesData}

【社交场景描述】
${scene}

请基于以上信息分析这个社交场景，给出座次安排、话题建议、矛盾提醒和礼物建议。`,
    },
  ]
}

function buildAlertPrompt(
  personsData: string,
  relationshipMemoriesData: string,
  userProfile: string
): Array<{ role: 'system' | 'user'; content: string }> {
  return [
    {
      role: 'system',
      content: `你是衡舟的关系温度预警系统。你的任务是监控所有人物的关系温度变化，在温度持续下降时主动预警，分析下降原因并给出修复建议。

【核心原则】
1. 重点关注：温度持续下降的关系、温度过低的关系、温度骤降的关系
2. 分析下降原因要结合记忆中的互动记录
3. 修复建议要具体可执行
4. 所有分析必须基于用户已有的人物关系数据

【温度标准】
- 0-30：冰点，急需修复
- 30-50：冷淡，需要主动维护
- 50-70：正常，但需关注趋势
- 70-100：良好

【输出要求】
输出严格的 JSON 数组，每个元素包含：
{
  "personName": "人物姓名",
  "relationship": "关系类型",
  "currentTemperature": 当前温度0-100,
  "declineAmount": 下降幅度,
  "declineReason": "下降原因分析",
  "riskLevel": "high|medium|low",
  "repairSuggestion": "修复建议"
}

只输出 JSON 数组，不要包含任何其他文字。如果所有关系温度健康，返回空数组 []。`,
    },
    {
      role: 'user',
      content: `【用户画像】
${userProfile}

【用户的人物关系档案（含温度历史和趋势）】
${personsData}

【与关系变化相关的记忆】
${relationshipMemoriesData}

请分析所有人物的关系温度状况，为温度下降或过低的关系生成预警和修复建议。`,
    },
  ]
}

// ============================================================
// 导出函数实现
// ============================================================

/**
 * 获取节日礼仪建议
 * 根据当前日期和用户人物关系数据，为即将到来的节日生成个性化送礼和问候建议
 */
export async function getFestivalEtiquette(): Promise<EtiquetteSuggestion[]> {
  const { persons, memories } = getCurrentData()
  if (persons.length === 0) return []

  const upcomingFestivals = getUpcomingFestivals(45)
  if (upcomingFestivals.length === 0) return []

  const personsData = persons.map(formatPersonForEtiquette).join('\n\n')
  const festivalsData = upcomingFestivals
    .map((f) => `${f.name}（${f.date}，距今${getDaysUntil(f.date)}天，${f.description}）`)
    .join('\n')
  const memoriesData = formatMemoriesForAI(memories, 20)
  const userProfile = getUserProfileSummary()

  const messages = buildFestivalPrompt(personsData, festivalsData, memoriesData, userProfile)

  try {
    const result = await safeChat(messages, { temperature: 0.4, maxTokens: 2048 })
    const parsed = parseJsonResponse<EtiquetteSuggestion[]>(result.text)
    if (parsed && Array.isArray(parsed)) {
      return parsed
    }
    return []
  } catch (err) {
    console.warn('[socialEtiquette] getFestivalEtiquette failed:', err)
    return []
  }
}

/**
 * 获取人情往来分析
 * 从记忆中提取"帮忙""欠人情""还人情"等关键词，分析人情往来平衡度
 */
export async function getSocialDebtAnalysis(): Promise<SocialDebtAnalysis> {
  const { persons, memories } = getCurrentData()

  const debtMemories = extractSocialDebtMemories(memories)
  const personsData = persons.map(formatPersonForEtiquette).join('\n\n')
  const debtMemoriesData = formatMemoriesForAI(debtMemories, 30)
  const userProfile = getUserProfileSummary()

  const messages = buildSocialDebtPrompt(personsData, debtMemoriesData, userProfile)

  try {
    const result = await safeChat(messages, { temperature: 0.4, maxTokens: 2048 })
    const parsed = parseJsonResponse<{
      items: SocialDebtItem[]
      summary: string
      balanceScore: number
    }>(result.text)
    if (parsed) {
      return {
        items: Array.isArray(parsed.items) ? parsed.items : [],
        summary: parsed.summary || '暂无分析',
        balanceScore: typeof parsed.balanceScore === 'number' ? parsed.balanceScore : 0,
        mode: result.mode,
      }
    }
    return {
      items: [],
      summary: '分析生成失败，请稍后重试',
      balanceScore: 0,
      mode: result.mode,
    }
  } catch (err) {
    console.warn('[socialEtiquette] getSocialDebtAnalysis failed:', err)
    return {
      items: [],
      summary: '分析服务暂时不可用',
      balanceScore: 0,
      mode: 'demo',
    }
  }
}

/**
 * 获取关系维护建议
 * 分析各人物的最后互动时间、关系温度变化趋势，生成个性化维护建议
 */
export async function getRelationshipMaintenance(): Promise<MaintenanceSuggestion[]> {
  const { persons, memories } = getCurrentData()
  if (persons.length === 0) return []

  const relationshipMemories = extractRelationshipMemories(memories)
  const personsData = persons.map(formatPersonForEtiquette).join('\n\n')
  const relationshipMemoriesData = formatMemoriesForAI(relationshipMemories, 20)
  const userProfile = getUserProfileSummary()

  const messages = buildMaintenancePrompt(personsData, relationshipMemoriesData, userProfile)

  try {
    const result = await safeChat(messages, { temperature: 0.4, maxTokens: 2048 })
    const parsed = parseJsonResponse<MaintenanceSuggestion[]>(result.text)
    if (parsed && Array.isArray(parsed)) {
      return parsed
    }
    return []
  } catch (err) {
    console.warn('[socialEtiquette] getRelationshipMaintenance failed:', err)
    return []
  }
}

/**
 * 社交场景分析
 * 输入社交场景描述，基于用户人物关系网络分析座次、话题、矛盾、礼物
 */
export async function analyzeSocialScene(scene: string): Promise<SceneAnalysis> {
  const { persons, memories } = getCurrentData()

  const personsData = persons.length > 0
    ? persons.map(formatPersonForEtiquette).join('\n\n')
    : '暂无人物关系数据'
  const memoriesData = formatMemoriesForAI(memories, 20)
  const userProfile = getUserProfileSummary()

  const messages = buildSceneAnalysisPrompt(scene, personsData, memoriesData, userProfile)

  try {
    const result = await safeChat(messages, { temperature: 0.5, maxTokens: 2048 })
    const parsed = parseJsonResponse<{
      seatingArrangement: string
      conflicts: string[]
      safeTopics: string[]
      forbiddenTopics: string[]
      giftSuggestions: string[]
      overallAdvice: string
    }>(result.text)
    if (parsed) {
      return {
        scene,
        seatingArrangement: parsed.seatingArrangement || '暂无建议',
        conflicts: Array.isArray(parsed.conflicts) ? parsed.conflicts : [],
        safeTopics: Array.isArray(parsed.safeTopics) ? parsed.safeTopics : [],
        forbiddenTopics: Array.isArray(parsed.forbiddenTopics) ? parsed.forbiddenTopics : [],
        giftSuggestions: Array.isArray(parsed.giftSuggestions) ? parsed.giftSuggestions : [],
        overallAdvice: parsed.overallAdvice || '暂无建议',
        mode: result.mode,
      }
    }
    return {
      scene,
      seatingArrangement: '分析生成失败，请稍后重试',
      conflicts: [],
      safeTopics: [],
      forbiddenTopics: [],
      giftSuggestions: [],
      overallAdvice: '分析服务暂时不可用，请稍后重试',
      mode: result.mode,
    }
  } catch (err) {
    console.warn('[socialEtiquette] analyzeSocialScene failed:', err)
    return {
      scene,
      seatingArrangement: '服务暂时不可用',
      conflicts: [],
      safeTopics: [],
      forbiddenTopics: [],
      giftSuggestions: [],
      overallAdvice: '分析服务暂时不可用，请稍后重试',
      mode: 'demo',
    }
  }
}

/**
 * 关系温度预警
 * 监控所有人物的关系温度变化，温度持续下降时主动预警
 */
export async function getRelationshipAlerts(): Promise<RelationshipAlert[]> {
  const { persons, memories } = getCurrentData()
  if (persons.length === 0) return []

  const relationshipMemories = extractRelationshipMemories(memories)
  const personsData = persons.map(formatPersonForEtiquette).join('\n\n')
  const relationshipMemoriesData = formatMemoriesForAI(relationshipMemories, 20)
  const userProfile = getUserProfileSummary()

  const messages = buildAlertPrompt(personsData, relationshipMemoriesData, userProfile)

  try {
    const result = await safeChat(messages, { temperature: 0.4, maxTokens: 2048 })
    const parsed = parseJsonResponse<RelationshipAlert[]>(result.text)
    if (parsed && Array.isArray(parsed)) {
      return parsed
    }
    return []
  } catch (err) {
    console.warn('[socialEtiquette] getRelationshipAlerts failed:', err)
    return []
  }
}

/**
 * 综合人情世故报告
 * 汇总节日礼仪、人情往来、关系维护、温度预警
 */
export async function getComprehensiveReport(): Promise<EtiquetteReport> {
  const { persons } = getCurrentData()

  // 如果没有人物数据，直接返回空报告
  if (persons.length === 0) {
    return {
      festivals: [],
      socialDebt: {
        items: [],
        summary: '暂无人物关系数据，请先通过对话积累人物档案',
        balanceScore: 0,
        mode: 'demo',
      },
      maintenance: [],
      alerts: [],
      generatedAt: Date.now(),
      mode: 'demo',
    }
  }

  // 并行获取所有分析
  const [festivals, socialDebt, maintenance, alerts] = await Promise.all([
    getFestivalEtiquette(),
    getSocialDebtAnalysis(),
    getRelationshipMaintenance(),
    getRelationshipAlerts(),
  ])

  // 综合模式：任一分析使用了 live 模式则为 live
  const mode: 'live' | 'demo' = socialDebt.mode

  return {
    festivals,
    socialDebt,
    maintenance,
    alerts,
    generatedAt: Date.now(),
    mode,
  }
}
