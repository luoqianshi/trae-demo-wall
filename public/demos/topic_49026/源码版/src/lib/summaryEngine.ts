// 日/月/年总结引擎 — 基于用户记忆、对话和人物数据自动生成总结
import { safeChat } from './ai'
import { db } from './db'
import { guardWrite } from './demoGuard'
import { getUserProfileObject } from './prompts'
import type { Memory, Person, DiaryEntry } from '../types'

export type SummaryPeriod = 'daily' | 'monthly' | 'yearly'

export interface SummaryResult {
  period: SummaryPeriod
  date: string              // 总结的日期标识 (YYYY-MM-DD / YYYY-MM / YYYY)
  title: string             // 总结标题
  content: string           // 总结正文（Markdown 格式）
  highlights: string[]      // 关键事项列表
  nextActions: string[]     // 次日/次月/次年待办
  mood: string              // 情绪概述
  peopleInvolved: string[]  // 涉及的人物
  mode: 'live' | 'demo'     // AI 模式
  generatedAt: number       // 生成时间戳
}

export interface SummaryConfig {
  dailyEnabled: boolean
  dailyTime: string         // "22:00"
  monthlyEnabled: boolean
  yearlyEnabled: boolean
  voiceAnnounce: boolean    // 是否语音播报
}

const DEFAULT_CONFIG: SummaryConfig = {
  dailyEnabled: true,
  dailyTime: '22:00',
  monthlyEnabled: true,
  yearlyEnabled: true,
  voiceAnnounce: false,
}

const CONFIG_KEY = 'hengzhou-summary-config'

export function getSummaryConfig(): SummaryConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    if (raw) return { ...DEFAULT_CONFIG, ...JSON.parse(raw) }
  } catch {}
  return DEFAULT_CONFIG
}

export function setSummaryConfig(config: Partial<SummaryConfig>): void {
  const current = getSummaryConfig()
  const merged = { ...current, ...config }
  localStorage.setItem(CONFIG_KEY, JSON.stringify(merged))
}

// 获取指定时间范围内的记忆
async function getMemoriesInRange(startTime: number, endTime: number): Promise<Memory[]> {
  return db.memories
    .where('createdAt')
    .between(startTime, endTime, true, true)
    .toArray()
}

// 获取指定时间范围内的日记
async function getDiariesInRange(startTime: number, endTime: number): Promise<DiaryEntry[]> {
  return db.diaries
    .where('timestamp')
    .between(startTime, endTime, true, true)
    .toArray()
}

// 获取所有人物（用于总结中涉及的人物）
async function getAllPersons(): Promise<Person[]> {
  return db.persons.toArray()
}

// 格式化人物信息供 AI 使用
function formatPersonsForSummary(persons: Person[]): string {
  return persons
    .filter(p => p.id !== 'p-self')
    .map(p => {
      const parts = [p.name]
      if (p.relationship) parts.push(`(${p.relationship})`)
      if (p.sentiment !== undefined) parts.push(`温度:${p.sentiment}`)
      if (p.traits?.length) parts.push(p.traits.slice(0, 2).join(','))
      return parts.join(' ')
    })
    .join('；')
}

// 生成每日总结
export async function generateDailySummary(date?: Date): Promise<SummaryResult> {
  const targetDate = date || new Date()
  const dateStr = formatDate(targetDate)
  const startTime = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0).getTime()
  const endTime = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59).getTime()

  const [memories, diaries, persons] = await Promise.all([
    getMemoriesInRange(startTime, endTime),
    getDiariesInRange(startTime, endTime),
    getAllPersons(),
  ])

  const profile = getUserProfileObject()
  const userName = profile.name || '你'

  // 如果没有数据，返回空总结
  if (memories.length === 0 && diaries.length === 0) {
    return {
      period: 'daily',
      date: dateStr,
      title: `${formatDateChinese(targetDate)} · 日常回顾`,
      content: '今天还没有记录任何内容。跟衡舟聊聊，让我记住你今天发生的事。',
      highlights: [],
      nextActions: [],
      mood: '平静',
      peopleInvolved: [],
      mode: 'demo',
      generatedAt: Date.now(),
    }
  }

  const memoryText = memories.map(m => `- [${m.type}] ${m.content}`).join('\n')
  const diaryText = diaries.map(d => `- ${d.content}`).join('\n')
  const personText = formatPersonsForSummary(persons)

  const prompt = `你是衡舟，用户的第二大脑和生活伴侣。请为用户生成今日总结。

【用户信息】
姓名：${userName}

【今日记忆】
${memoryText || '（无记忆记录）'}

【今日日记】
${diaryText || '（无日记记录）'}

【人物关系】
${personText || '（无人物记录）'}

【要求】
1. 用温暖、简洁的语言总结今天
2. 提炼 2-5 个关键事项
3. 列出明天需要关注的事（基于记忆中的承诺和待办）
4. 用"你"称呼用户，不要用用户姓名或"用户"
5. 总结不超过 300 字

请以 JSON 格式输出：
{
  "title": "总结标题",
  "content": "总结正文（Markdown）",
  "highlights": ["关键事项1", "关键事项2"],
  "nextActions": ["明日待办1", "明日待办2"],
  "mood": "情绪概述（如：充实/疲惫/平静/焦虑）",
  "peopleInvolved": ["涉及的人物名字"]
}`

  const { text, mode } = await safeChat(
    [
      { role: 'system', content: '你是衡舟，一个温暖、智慧的个人AI助手。请用JSON格式回复。' },
      { role: 'user', content: prompt },
    ],
    { temperature: 0.6, maxTokens: 800 }
  )

  const parsed = parseSummaryResponse(text)

  return {
    period: 'daily',
    date: dateStr,
    title: parsed.title || `${formatDateChinese(targetDate)} · 日常回顾`,
    content: parsed.content || text,
    highlights: parsed.highlights || [],
    nextActions: parsed.nextActions || [],
    mood: parsed.mood || '平静',
    peopleInvolved: parsed.peopleInvolved || [],
    mode,
    generatedAt: Date.now(),
  }
}

// 生成月度总结
export async function generateMonthlySummary(year?: number, month?: number): Promise<SummaryResult> {
  const now = new Date()
  const y = year ?? now.getFullYear()
  const m = month ?? now.getMonth()
  const dateStr = `${y}-${String(m + 1).padStart(2, '0')}`

  const startTime = new Date(y, m, 1).getTime()
  const endTime = new Date(y, m + 1, 0, 23, 59, 59).getTime()

  const [memories, diaries, persons] = await Promise.all([
    getMemoriesInRange(startTime, endTime),
    getDiariesInRange(startTime, endTime),
    getAllPersons(),
  ])

  const profile = getUserProfileObject()
  const userName = profile.name || '你'

  const memoryText = memories.slice(0, 50).map(m => `- [${m.type}] ${m.content}`).join('\n')
  const diaryText = diaries.slice(0, 30).map(d => `- ${d.content}`).join('\n')
  const personText = formatPersonsForSummary(persons)

  const prompt = `你是衡舟，用户的第二大脑和生活伴侣。请为用户生成月度总结。

【用户信息】
姓名：${userName}

【本月记忆（共${memories.length}条，显示前50条）】
${memoryText || '（无记忆记录）'}

【本月日记（共${diaries.length}条）】
${diaryText || '（无日记记录）'}

【人物关系】
${personText || '（无人物记录）'}

【要求】
1. 回顾本月关键事件和变化
2. 分析关系温度变化（谁变近了、谁变远了）
3. 总结本月情绪和状态趋势
4. 列出下月需要关注的重要事项（生日/纪念日/到期承诺）
5. 用"你"称呼用户
6. 总结不超过 500 字

请以 JSON 格式输出：
{
  "title": "总结标题",
  "content": "总结正文（Markdown）",
  "highlights": ["关键事项1", "关键事项2"],
  "nextActions": ["下月待办1", "下月待办2"],
  "mood": "本月情绪概述",
  "peopleInvolved": ["涉及的人物名字"]
}`

  const { text, mode } = await safeChat(
    [
      { role: 'system', content: '你是衡舟，一个温暖、智慧的个人AI助手。请用JSON格式回复。' },
      { role: 'user', content: prompt },
    ],
    { temperature: 0.6, maxTokens: 1200 }
  )

  const parsed = parseSummaryResponse(text)

  return {
    period: 'monthly',
    date: dateStr,
    title: parsed.title || `${y}年${m + 1}月 · 月度回顾`,
    content: parsed.content || text,
    highlights: parsed.highlights || [],
    nextActions: parsed.nextActions || [],
    mood: parsed.mood || '平稳',
    peopleInvolved: parsed.peopleInvolved || [],
    mode,
    generatedAt: Date.now(),
  }
}

// 生成年度总结
export async function generateYearlySummary(year?: number): Promise<SummaryResult> {
  const now = new Date()
  const y = year ?? now.getFullYear()
  const dateStr = `${y}`

  const startTime = new Date(y, 0, 1).getTime()
  const endTime = new Date(y, 11, 31, 23, 59, 59).getTime()

  const [memories, , persons] = await Promise.all([
    getMemoriesInRange(startTime, endTime),
    getDiariesInRange(startTime, endTime),
    getAllPersons(),
  ])

  const profile = getUserProfileObject()
  const userName = profile.name || '你'

  const memoryText = memories.slice(0, 80).map(m => `- [${m.type}] ${m.content}`).join('\n')
  const personText = formatPersonsForSummary(persons)

  const prompt = `你是衡舟，用户的第二大脑和生活伴侣。请为用户生成年度总结。

【用户信息】
姓名：${userName}

【本年记忆（共${memories.length}条，显示前80条）】
${memoryText || '（无记忆记录）'}

【人物关系网络】
${personText || '（无人物记录）'}

【要求】
1. 回顾这一年的人生轨迹和重大决策
2. 分析关系网络的演变（新增了谁、疏远了谁）
3. 总结个人成长和变化
4. 对新的一年给出建议和展望
5. 用"你"称呼用户
6. 总结不超过 800 字，要有温度和深度

请以 JSON 格式输出：
{
  "title": "年度总结标题",
  "content": "总结正文（Markdown，有层次感）",
  "highlights": ["年度关键事项1", "年度关键事项2"],
  "nextActions": ["新年目标1", "新年目标2"],
  "mood": "年度情绪基调",
  "peopleInvolved": ["重要人物名字"]
}`

  const { text, mode } = await safeChat(
    [
      { role: 'system', content: '你是衡舟，一个温暖、智慧的个人AI助手。请用JSON格式回复。' },
      { role: 'user', content: prompt },
    ],
    { temperature: 0.7, maxTokens: 1500 }
  )

  const parsed = parseSummaryResponse(text)

  return {
    period: 'yearly',
    date: dateStr,
    title: parsed.title || `${y}年 · 年度回顾`,
    content: parsed.content || text,
    highlights: parsed.highlights || [],
    nextActions: parsed.nextActions || [],
    mood: parsed.mood || '充实',
    peopleInvolved: parsed.peopleInvolved || [],
    mode,
    generatedAt: Date.now(),
  }
}

// 解析 AI 返回的 JSON
function parseSummaryResponse(text: string): Partial<SummaryResult> {
  try {
    // 尝试提取 JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        title: parsed.title,
        content: parsed.content,
        highlights: Array.isArray(parsed.highlights) ? parsed.highlights : [],
        nextActions: Array.isArray(parsed.nextActions) ? parsed.nextActions : [],
        mood: parsed.mood,
        peopleInvolved: Array.isArray(parsed.peopleInvolved) ? parsed.peopleInvolved : [],
      }
    }
  } catch (e) {
    console.warn('[Summary] JSON 解析失败，使用原始文本:', e)
  }
  return { content: text }
}

// 格式化日期
function formatDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function formatDateChinese(date: Date): string {
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

// 将总结保存为记忆
export async function saveSummaryAsMemory(summary: SummaryResult): Promise<void> {
  // Demo Guard: 演示模式下禁止写入
  guardWrite('保存总结记忆')

  const content = `【${summary.title}】\n${summary.content}\n\n关键事项：${summary.highlights.join('；')}\n待办：${summary.nextActions.join('；')}`

  await db.memories.add({
    id: `summary-${summary.period}-${summary.date}-${Date.now()}`,
    type: 'insight',
    content,
    source: 'summary',
    confidence: 'high',
    confirmed: true,
    tags: ['总结', summary.period, summary.date],
    relatedPersonIds: [],
    relatedMemoryIds: [],
    createdAt: Date.now(),
    isDemo: 0,
  })
}

// 获取历史总结列表
export async function getSummaryHistory(period?: SummaryPeriod): Promise<Summary[]> {
  let query = db.memories.where('type').equals('insight')
  const all = await query.toArray()
  let summaries = all.filter(m => m.source === 'summary' && m.tags?.includes('总结'))

  if (period) {
    summaries = summaries.filter(m => m.tags?.includes(period))
  }

  return summaries
    .sort((a, b) => b.createdAt - a.createdAt)
    .map(m => ({
      id: m.id,
      title: m.content.split('\n')[0]?.replace(/【|】/g, '') || '总结',
      date: m.tags?.find(t => /^\d{4}/.test(t)) || '',
      period: (m.tags?.find(t => ['daily', 'monthly', 'yearly'].includes(t)) || 'daily') as SummaryPeriod,
      content: m.content,
      createdAt: m.createdAt,
    }))
}

export interface Summary {
  id: string
  title: string
  date: string
  period: SummaryPeriod
  content: string
  createdAt: number
}

// 检查是否需要生成每日总结（由定时器调用）
export async function checkAndGenerateDailySummary(): Promise<SummaryResult | null> {
  const config = getSummaryConfig()
  if (!config.dailyEnabled) return null

  const now = new Date()
  const todayStr = formatDate(now)

  // 检查今天是否已生成
  const existing = await db.memories
    .where('type').equals('insight')
    .toArray()
  const todaySummary = existing.find(m =>
    m.source === 'summary' &&
    m.tags?.includes('daily') &&
    m.tags?.includes(todayStr)
  )
  if (todaySummary) return null // 今天已生成

  // 生成总结
  const summary = await generateDailySummary(now)
  await saveSummaryAsMemory(summary)
  return summary
}
