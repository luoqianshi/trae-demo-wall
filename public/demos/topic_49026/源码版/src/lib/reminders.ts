// 主动提醒生成器 v3
// 基于真实记忆数据生成提醒 + 注意力预算管理 + 新闻摘要 + 日程提取 + 生日提醒
// [HMR-TOUCH] 2026-06-20: 修复重复提醒问题

import { db } from './db'
import { chat } from './ai'
import { pluginEngine } from './pluginEngine'

export type ReminderType = 'memory' | 'person' | 'task' | 'news' | 'birthday' | 'milestone' | 'health' | 'finance'
export type ReminderPriority = 'high' | 'medium' | 'low'

export interface Reminder {
  id: string
  type: ReminderType
  title: string
  content: string
  time?: string
  source: string // 来源记忆ID
  priority: ReminderPriority
  actionable: boolean
  dueDate?: number
  category?: string // 用于新闻分类等
}

// --- 注意力预算管理 ---

const BUDGET_KEY = 'hengzhou-attention-budget'
const BUDGET_DAILY_MAX = 5 // 每天最多展示5条非紧急提醒
const BUDGET_PAUSED_KEY = 'hengzhou-attention-paused'

function getToday(): string {
  return new Date().toISOString().slice(0, 10)
}

export function getDailyBudget(): { used: number; max: number; paused: boolean } {
  const raw = localStorage.getItem(BUDGET_KEY)
  const today = getToday()
  let data: { date: string; count: number } = { date: today, count: 0 }
  try {
    const parsed = JSON.parse(raw || '{}')
    if (parsed.date === today) data = parsed
  } catch { /* ignore */ }
  return {
    used: data.count,
    max: BUDGET_DAILY_MAX,
    paused: localStorage.getItem(BUDGET_PAUSED_KEY) === today,
  }
}

export function consumeBudget(): boolean {
  const budget = getDailyBudget()
  if (budget.paused) return false
  if (budget.used >= budget.max) return false
  const today = getToday()
  localStorage.setItem(BUDGET_KEY, JSON.stringify({ date: today, count: budget.used + 1 }))
  return true
}

export function pauseTodayReminders(): void {
  localStorage.setItem(BUDGET_PAUSED_KEY, getToday())
}

export function resumeReminders(): void {
  localStorage.removeItem(BUDGET_PAUSED_KEY)
}

// --- 新闻摘要（模拟，未来接入真实API） ---

export interface NewsItem {
  category: 'tech' | 'finance' | 'health' | 'culture'
  title: string
  summary: string
  relevanceScore: number
}

const MOCK_NEWS: NewsItem[] = [
  { category: 'tech', title: 'AI 编程助手迎来重大突破', summary: '新一代代码生成模型在复杂项目理解能力上提升显著，开发者效率有望再上新台阶。', relevanceScore: 75 },
  { category: 'finance', title: '央行释放流动性信号', summary: '市场预期货币政策将保持宽松，权益资产估值有望获得支撑。', relevanceScore: 80 },
  { category: 'health', title: '间歇性禁食新研究', summary: '最新研究表明合理的间歇性禁食可改善代谢指标，但需因人而异。', relevanceScore: 65 },
  { category: 'culture', title: '国产科幻电影海外热映', summary: '多部国产科幻作品在国际流媒体平台获得高分评价，文化输出初见成效。', relevanceScore: 50 },
  { category: 'tech', title: '端侧大模型部署成本骤降', summary: '模型压缩技术突破使得手机本地运行十亿参数模型成为现实。', relevanceScore: 70 },
  { category: 'finance', title: '个人养老金制度扩容', summary: '新增多只指数基金纳入个人养老金投资范围，长期投资者选择更丰富。', relevanceScore: 85 },
  { category: 'health', title: '睡眠质量与认知衰退关联', summary: '长期睡眠不足可能加速认知能力下降，专家建议成年人保持7-8小时睡眠。', relevanceScore: 90 },
  { category: 'culture', title: '数字博物馆访问量创新高', summary: '虚拟现实技术让文物"活"起来，年轻一代对传统文化兴趣显著回升。', relevanceScore: 45 },
]

function getUserInterests(): string[] {
  try {
    const profileRaw = localStorage.getItem('hengzhou-user-profile')
    if (profileRaw) {
      const profile = JSON.parse(profileRaw)
      if (profile.interests && Array.isArray(profile.interests)) {
        return profile.interests as string[]
      }
    }
  } catch { /* ignore */ }
  return []
}

function interestToCategory(interest: string): string | null {
  const map: Record<string, string> = {
    '科技': 'tech', '技术': 'tech', '编程': 'tech', 'AI': 'tech', '人工智能': 'tech',
    '财经': 'finance', '投资': 'finance', '理财': 'finance', '股票': 'finance', '基金': 'finance',
    '健康': 'health', '养生': 'health', '健身': 'health', '医疗': 'health',
    '文化': 'culture', '艺术': 'culture', '电影': 'culture', '读书': 'culture', '历史': 'culture',
  }
  return map[interest] || null
}

export async function fetchDailyNews(): Promise<NewsItem[]> {
  // 模拟API延迟
  await new Promise((resolve) => setTimeout(resolve, 200))
  const interests = getUserInterests()
  if (interests.length === 0) {
    return MOCK_NEWS.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 3)
  }
  const preferredCategories = new Set(interests.map(interestToCategory).filter(Boolean) as string[])
  const scored = MOCK_NEWS.map((n) => ({
    ...n,
    relevanceScore: n.relevanceScore + (preferredCategories.has(n.category) ? 20 : 0),
  }))
  return scored.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 3)
}

// --- 日程/事件提取 ---

function extractFutureEventsFromDiary(content: string): Array<{ description: string; dueDate: number }> {
  const events: Array<{ description: string; dueDate: number }> = []
  const now = new Date()
  const currentYear = now.getFullYear()

  // 匹配 "下周三有个重要会议"、"明天要去医院" 等
  const relativePatterns = [
    { regex: /(明天|后天|大后天)([^，。；]+)/g, days: [1, 2, 3] },
    { regex: /(本周|这周)([^，。；]+)/g, days: [0, 7] },
    { regex: /(下周)([^，。；]+)/g, days: [7, 14] },
  ]

  for (const p of relativePatterns) {
    let match: RegExpExecArray | null
    while ((match = p.regex.exec(content)) !== null) {
      const desc = match[2].trim()
      if (desc.length > 2 && desc.length < 50) {
        const targetDate = new Date(now)
        targetDate.setDate(targetDate.getDate() + (p.days[0] || 1))
        events.push({ description: `${match[1]}${desc}`, dueDate: targetDate.getTime() })
      }
    }
  }

  // 匹配 "X月X日" 格式
  const datePattern = /(\d{1,2})月(\d{1,2})日([^，。；]{2,40})/g
  let dm: RegExpExecArray | null
  while ((dm = datePattern.exec(content)) !== null) {
    const month = parseInt(dm[1])
    const day = parseInt(dm[2])
    const desc = dm[3].trim()
    let targetYear = currentYear
    const target = new Date(targetYear, month - 1, day)
    if (target.getTime() < now.getTime()) {
      targetYear++
    }
    const finalTarget = new Date(targetYear, month - 1, day)
    const diffDays = (finalTarget.getTime() - now.getTime()) / 86400000
    if (diffDays >= 0 && diffDays <= 30) {
      events.push({ description: `${month}月${day}日${desc}`, dueDate: finalTarget.getTime() })
    }
  }

  return events
}

function extractCommitmentsFromMemories(memories: Array<{ content: string; id: string }>): Array<{ content: string; id: string; dueDate?: number }> {
  const results: Array<{ content: string; id: string; dueDate?: number }> = []
  const now = new Date()
  const currentYear = now.getFullYear()

  for (const m of memories) {
    // 提取承诺中的时间信息
    const datePattern = /(\d{1,2})月(\d{1,2})日/
    const match = m.content.match(datePattern)
    if (match) {
      const month = parseInt(match[1])
      const day = parseInt(match[2])
      let targetYear = currentYear
      const target = new Date(targetYear, month - 1, day)
      if (target.getTime() < now.getTime()) {
        targetYear++
      }
      const finalTarget = new Date(targetYear, month - 1, day)
      const diffDays = (finalTarget.getTime() - now.getTime()) / 86400000
      if (diffDays >= -1 && diffDays <= 14) {
        results.push({ content: m.content, id: m.id, dueDate: finalTarget.getTime() })
        continue
      }
    }
    results.push({ content: m.content, id: m.id })
  }

  return results
}

function getDaysUntilBirthday(birthday: string): number {
  const now = new Date()
  const currentYear = now.getFullYear()
  const [month, day] = birthday.split('-').map(Number)
  if (!month || !day) return Infinity

  let target = new Date(currentYear, month - 1, day)
  if (target.getTime() < now.getTime()) {
    target = new Date(currentYear + 1, month - 1, day)
  }
  return Math.ceil((target.getTime() - now.getTime()) / 86400000)
}

// --- 智能排序 ---

function sortReminders(reminders: Reminder[]): Reminder[] {
  const priorityScore = { high: 3, medium: 2, low: 1 }
  return reminders.sort((a, b) => {
    // high优先
    const pa = priorityScore[a.priority] || 0
    const pb = priorityScore[b.priority] || 0
    if (pa !== pb) return pb - pa

    // actionable优先
    if (a.actionable !== b.actionable) return (b.actionable ? 1 : 0) - (a.actionable ? 1 : 0)

    // 时间紧迫优先
    const da = a.dueDate || Infinity
    const db_ = b.dueDate || Infinity
    return da - db_
  })
}

// --- 提醒生成 ---

// FIX: 去重机制 — 防止多组件并发调用 generateReminders() 导致 IndexedDB 事务冲突
let _reminderPromise: Promise<Reminder[]> | null = null
let _reminderLastResult: Reminder[] = []
let _reminderLastTime = 0
const REMINDER_CACHE_TTL = 30_000 // 30 秒缓存，避免频繁调用

export async function generateReminders(): Promise<Reminder[]> {
  // 30 秒内直接返回缓存结果
  const now = Date.now()
  if (_reminderLastResult && now - _reminderLastTime < REMINDER_CACHE_TTL) {
    return _reminderLastResult
  }
  // 如果已有正在执行的调用，复用其 Promise
  if (_reminderPromise) {
    return _reminderPromise
  }

  _reminderPromise = _generateRemindersImpl()
  try {
    const result = await _reminderPromise
    _reminderLastResult = result
    _reminderLastTime = Date.now()
    return result
  } finally {
    _reminderPromise = null
  }
}

async function _generateRemindersImpl(): Promise<Reminder[]> {
  const budget = getDailyBudget()
  const reminders: Reminder[] = []

  // FIX: 预读所有记忆和人物，避免后续网络调用后访问 DB 导致 TransactionInactiveError
  const allMemories = await db.memories.toArray()
  const allPeople = await db.persons.toArray()

  // ===== 1. 任务提醒（紧急 + 普通）=====
  const commitments = allMemories
    .filter((m) => m.type === 'commitment' && m.confirmed)

  // 按创建时间倒序排列，确保最近的承诺优先处理
  commitments.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
  const extractedCommitments = extractCommitmentsFromMemories(commitments.slice(0, 10))

  for (const c of extractedCommitments) {
    const isUrgent = c.dueDate && (c.dueDate - Date.now()) / 86400000 <= 3
    reminders.push({
      id: `task-${c.id}`,
      type: 'task',
      title: '待办提醒',
      content: c.content,
      source: c.id,
      priority: isUrgent ? 'high' : 'medium',
      actionable: true,
      dueDate: c.dueDate,
    })
  }

  // ===== 2. 从日记提取未来事件 =====
  const recentDiaries = await db.diaries.orderBy('timestamp').reverse().limit(14).toArray()
  const futureEvents: Reminder[] = []
  for (const diary of recentDiaries) {
    const events = extractFutureEventsFromDiary(diary.content)
    for (const ev of events) {
      futureEvents.push({
        id: `event-${diary.id}-${ev.dueDate}`,
        type: 'milestone',
        title: '日程提醒',
        content: ev.description,
        source: diary.id,
        priority: 'medium',
        actionable: true,
        dueDate: ev.dueDate,
      })
    }
  }
  // 去重
  const seenEvents = new Set<string>()
  for (const ev of futureEvents) {
    const key = ev.content.slice(0, 20)
    if (!seenEvents.has(key)) {
      seenEvents.add(key)
      reminders.push(ev)
    }
  }

  // ===== 3. 生日提醒 =====
  for (const person of allPeople) {
    const birthday = person.profile?.identity?.birthday
    if (!birthday) continue
    const daysUntil = getDaysUntilBirthday(birthday)
    if (daysUntil <= 7 && daysUntil >= 0) {
      reminders.push({
        id: `birthday-${person.id}`,
        type: 'birthday',
        title: '生日提醒',
        content: `${person.name} 的${daysUntil === 0 ? '生日就在今天' : daysUntil === 1 ? '生日就在明天' : `生日还有 ${daysUntil} 天`}，记得送上祝福${person.profile.identity.nicknames?.[0] ? `（${person.profile.identity.nicknames[0]}）` : ''}`,
        source: person.id,
        priority: daysUntil <= 1 ? 'high' : 'medium',
        actionable: true,
        dueDate: Date.now() + daysUntil * 86400000,
      })
    }
  }

  // ===== 4. 健康提醒 =====
  const healthMemories = allMemories
    .filter((m) => m.confirmed && (m.content.includes('体检') || m.content.includes('血压') || m.content.includes('甘油三酯') || m.content.includes('医生') || m.content.includes('血糖') || m.content.includes('戒酒') || m.content.includes('喝酒')))
  if (healthMemories.length > 0) {
    const contents = healthMemories.map((m) => m.content).join('\n')

    if (contents.includes('甘油三酯') || contents.includes('脂肪肝') || contents.includes('血压') || contents.includes('血糖')) {
      reminders.push({
        id: 'health-goal-exercise',
        type: 'health',
        title: '健康目标',
        content: '本周完成至少 3 次 30 分钟有氧运动，帮助改善代谢指标。',
        source: healthMemories[0].id,
        priority: 'medium',
        actionable: true,
        dueDate: Date.now() + 7 * 86400000,
      })
    }

    if (contents.includes('戒酒') || contents.includes('少喝酒') || contents.includes('喝酒')) {
      reminders.push({
        id: 'health-goal-no-alcohol',
        type: 'health',
        title: '健康目标',
        content: '今日不饮酒，连续打卡养成习惯。',
        source: healthMemories.find((m) => m.content.includes('酒'))?.id || 'health',
        priority: 'medium',
        actionable: true,
        dueDate: Date.now() + 1 * 86400000,
      })
    }

    reminders.push({
      id: 'health-check',
      type: 'health',
      title: '健康关注',
      content: '你的体检/指标记录提示需要关注生活习惯，建议定期复查并遵医嘱。',
      source: healthMemories[0].id,
      priority: 'medium',
      actionable: false,
    })
  }

  // 睡眠问题提醒
  const sleepRelated = recentDiaries.filter((d) =>
    d.content.includes('睡') || d.content.includes('失眠') || d.content.includes('熬夜')
  )
  if (sleepRelated.length >= 2) {
    reminders.push({
      id: 'health-sleep',
      type: 'health',
      title: '睡眠关注',
      content: `最近 ${sleepRelated.length} 篇日记提到睡眠问题，建议关注作息规律。`,
      source: 'diary-analysis',
      priority: 'low',
      actionable: false,
    })
  }

  // ===== 4.5 银发关怀：长辈健康提醒 =====
  const elderHealthMemories = allMemories.filter(
    (m) => m.confirmed && m.type === 'health' &&
    (m.tags.includes('母亲') || m.tags.includes('父亲') || m.tags.includes('长辈') ||
     m.relatedPersonIds.some(id => allPeople.find(p => p.id === id)?.relationship === 'family'))
  )
  if (elderHealthMemories.length > 0) {
    // 用药提醒
    const medicationMem = elderHealthMemories.find(m =>
      m.content.includes('药') || m.content.includes('吃药') || m.content.includes('服药')
    )
    if (medicationMem) {
      const elderName = allPeople.find(p => medicationMem.relatedPersonIds.includes(p.id))?.name || '长辈'
      reminders.push({
        id: 'elder-medication',
        type: 'health',
        title: `${elderName}用药提醒`,
        content: `${elderName}需要按时服药，记得提醒${elderName}每天定时吃药。${medicationMem.content.slice(0, 50)}`,
        source: medicationMem.id,
        priority: 'high',
        actionable: true,
      })
    }
    // 体检/复查提醒
    const checkupMem = elderHealthMemories.find(m =>
      m.content.includes('复查') || m.content.includes('体检') || m.content.includes('检查')
    )
    if (checkupMem) {
      const elderName = allPeople.find(p => checkupMem.relatedPersonIds.includes(p.id))?.name || '长辈'
      reminders.push({
        id: 'elder-checkup',
        type: 'health',
        title: `${elderName}体检/复查提醒`,
        content: `${elderName}有待复查的项目，请尽快安排时间带${elderName}去检查。${checkupMem.content.slice(0, 50)}`,
        source: checkupMem.id,
        priority: 'high',
        actionable: true,
      })
    }
    // 通话关怀提醒
    const lastContactMem = elderHealthMemories.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))[0]
    if (lastContactMem) {
      const daysSinceContact = Math.floor((Date.now() - (lastContactMem.createdAt || 0)) / 86400000)
      if (daysSinceContact >= 3) {
        const elderName = allPeople.find(p => lastContactMem.relatedPersonIds.includes(p.id))?.name || '长辈'
        reminders.push({
          id: 'elder-call',
          type: 'person',
          title: '关怀通话',
          content: `已经${daysSinceContact}天没联系${elderName}了，打个电话问候一下吧。${elderName}的健康状况需要持续关注。`,
          source: lastContactMem.id,
          priority: 'medium',
          actionable: true,
        })
      }
    }
  }

  // ===== 5. 财务提醒 =====
  const financeMemories = allMemories
    .filter((m) => m.confirmed && (m.content.includes('理财') || m.content.includes('投资') || m.content.includes('基金') || m.content.includes('房贷') || m.content.includes('保险')))
  if (financeMemories.length > 0) {
    reminders.push({
      id: 'finance-review',
      type: 'finance',
      title: '财务回顾',
      content: '你有理财相关的记录，建议定期回顾资产配置和投资计划。',
      source: financeMemories[0].id,
      priority: 'low',
      actionable: false,
    })
  }

  // ===== 6. 新闻摘要 =====
  if (consumeBudget() || budget.paused) {
    try {
      const news = await fetchDailyNews()
      for (const item of news.slice(0, 2)) {
        reminders.push({
          id: `news-${item.category}-${item.title.slice(0, 10)}`,
          type: 'news',
          title: item.title,
          content: item.summary,
          source: 'news-api',
          priority: 'low',
          actionable: false,
          category: item.category,
        })
      }
    } catch (e) {
      console.warn('News fetch error:', e)
    }
  }

  // ===== 7. 职场压力提醒 =====
  const events = allMemories.filter((m) => m.type === 'event' && m.confirmed)
  const leaders = allPeople.filter(p => p.relationship === 'leader')
  const leaderNames = leaders.map(p => p.name)
  const workStress = events.filter((e) =>
    leaderNames.some(n => e.content.includes(n)) || e.content.includes('敲打') || e.content.includes('压力')
  )
  if (workStress.length >= 2) {
    reminders.push({
      id: 'stress-work',
      type: 'milestone',
      title: '职场关注',
      content: `职场压力反复出现（${workStress.length} 次记录），建议考虑职业规划或寻求支持。`,
      source: workStress[0].id,
      priority: 'medium',
      actionable: false,
    })
  }

  // ===== 8. 记忆/人物关联提醒 =====
  const recentMemories = [...allMemories].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 3)
  for (const memory of recentMemories) {
    if (memory.relatedPersonIds && memory.relatedPersonIds.length > 0) {
      const relatedPerson = allPeople.find(p => p.id === memory.relatedPersonIds[0])
      if (relatedPerson) {
        reminders.push({
          id: `memory-${memory.id}`,
          type: 'memory',
          title: '记忆回顾',
          content: `关于 ${relatedPerson.name}：${memory.content}`,
          source: memory.id,
          priority: 'low',
          actionable: false,
        })
      }
    }
  }

  // ===== 9. LLM个性化关怀 =====
  if (consumeBudget()) {
    try {
      if (recentMemories.length > 0) {
        const memorySummary = recentMemories.map(m => `- [${m.type}] ${m.content}`).join('\n')
        const today = new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })
        const tip = await chat(
          [{ role: 'user', content: `今天是${today}。用户最近的记忆：\n${memorySummary}\n\n请生成简短的关怀提醒。` }],
          {
            system: '你是衡舟。根据用户最近的记忆，生成一条简短的关怀提醒（30-50字）。温暖、具体、有行动建议。不要说"根据你的记忆"，像朋友一样自然。',
            temperature: 0.8,
            maxTokens: 100,
            preferDoubao: true,  // OPT-2: 后台提醒生成用豆包
          }
        )
        if (tip) {
          reminders.push({
            id: 'tip-personal',
            type: 'person',
            title: '衡舟的关怀',
            content: tip.trim(),
            source: 'ai-generated',
            priority: 'low',
            actionable: false,
          })
        }
      }
    } catch (e) {
      console.warn('LLM reminder error:', e)
    }
  }

  // ===== 10. 插件自定义提醒 =====
  if (consumeBudget()) {
    try {
      // FIX: allMemories 已在第 9 步预读，无需再次访问 DB
      const pluginCtx = {
        userInput: '',
        messages: [],
        memories: allMemories,
        people: allPeople,
        diaries: recentDiaries,
        userProfile: localStorage.getItem('hengzhou-user-profile') || '',
      }
      const pluginReminders = await pluginEngine.generateReminders(pluginCtx)
      if (pluginReminders && pluginReminders.length > 0) {
        for (const pr of pluginReminders.slice(0, 2)) {
          reminders.push({
            id: `plugin-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            type: (pr.type as ReminderType) || 'memory',
            title: pr.title,
            content: pr.content,
            source: 'plugin',
            priority: (pr.priority as ReminderPriority) || 'low',
            actionable: false,
          })
        }
      }
    } catch (e) {
      console.warn('Plugin reminder error:', e)
    }
  }

  // 基于 id 和内容去重，避免重复提醒（防止同一提醒被多次生成导致 React key 冲突）
  const seenIds = new Set<string>()
  const seenContents = new Set<string>()
  const dedupedReminders = reminders.filter((r) => {
    // ID 去重
    if (seenIds.has(r.id)) return false
    // 内容去重（取前30字符作为指纹，避免相似内容重复展示）
    const contentKey = r.content.slice(0, 30)
    if (seenContents.has(contentKey)) return false
    seenIds.add(r.id)
    seenContents.add(contentKey)
    return true
  })

  // 智能排序并限制数量
  const sorted = sortReminders(dedupedReminders)
  return sorted.slice(0, 12)
}

// 旧版函数别名，保持兼容性
// [HMR-FORCE-RELOAD] 2026-06-20 v2: 触发Vite HMR重新加载
export const generateDailyReminders = generateReminders
