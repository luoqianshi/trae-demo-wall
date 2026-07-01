/**
 * MCP — 模型上下文协议集成
 *
 * 企业级技术降维：Anthropic MCP (Model Context Protocol) 2026 → 个人 AI 助手工具调用
 *
 * 核心思路：
 * - 企业级：MCP 让 AI 连接数据库、API、文件系统等外部工具
 * - 个人降维：衡舟的 AI 能调用日历、通讯录、日记等"个人工具"
 * - 标准化工具调用过程，让用户看到 AI "使用了什么工具"
 *
 * 实现：
 * 1. 定义 MCP Server 接口（日历/通讯录/日记/关系图谱）
 * 2. AI 对话时自动判断是否需要调用工具
 * 3. 执行工具调用，将结果注入对话上下文
 * 4. UI 展示"AI 调用了日历工具"等工具调用过程
 */

import type { Person, Memory } from '../types'
import { db } from './db'
import { getManualReminders } from './manualReminders'
import { generateReminders, type Reminder } from './reminders'
import { buildAdjacencyList, bfsGraphTraversal, type GraphPath } from './graphRAG'

// ─── 类型定义 ───────────────────────────────────────────────

export interface MCPTool {
  name: string
  description: string
  server: string
  parameters: Record<string, { type: string; description: string; required: boolean }>
}

export interface MCPToolCall {
  id: string
  tool: MCPTool
  arguments: Record<string, unknown>
  result: unknown
  timestamp: number
  duration: number
  success: boolean
  error?: string
}

export interface MCPServerInfo {
  name: string
  description: string
  tools: MCPTool[]
  connected: boolean
}

// ─── MCP Server 定义 ────────────────────────────────────────

export const MCP_SERVERS: MCPServerInfo[] = [
  {
    name: 'calendar',
    description: '日历服务 — 查询日程、设置提醒',
    connected: true,
    tools: [
      {
        name: 'get_upcoming_events',
        description: '获取未来 N 天的日程安排',
        server: 'calendar',
        parameters: {
          days: { type: 'number', description: '查询未来几天', required: false },
        },
      },
      {
        name: 'find_free_time',
        description: '查找空闲时间段',
        server: 'calendar',
        parameters: {
          duration_minutes: { type: 'number', description: '需要的时长（分钟）', required: true },
        },
      },
    ],
  },
  {
    name: 'contacts',
    description: '通讯录服务 — 查询联系人信息',
    connected: true,
    tools: [
      {
        name: 'search_person',
        description: '按名称搜索联系人',
        server: 'contacts',
        parameters: {
          name: { type: 'string', description: '人物名称', required: true },
        },
      },
      {
        name: 'get_person_detail',
        description: '获取联系人详细信息',
        server: 'contacts',
        parameters: {
          person_id: { type: 'string', description: '人物 ID', required: true },
        },
      },
    ],
  },
  {
    name: 'journal',
    description: '日记服务 — 检索历史日记',
    connected: true,
    tools: [
      {
        name: 'search_journal',
        description: '搜索日记内容',
        server: 'journal',
        parameters: {
          keyword: { type: 'string', description: '搜索关键词', required: true },
          limit: { type: 'number', description: '返回条数', required: false },
        },
      },
    ],
  },
  {
    name: 'relationships',
    description: '关系图谱服务 — 查询人物关系',
    connected: true,
    tools: [
      {
        name: 'get_relationships',
        description: '获取某人物的所有关系',
        server: 'relationships',
        parameters: {
          person_id: { type: 'string', description: '人物 ID', required: true },
        },
      },
      {
        name: 'find_connection_path',
        description: '查找两个人物之间的关系路径',
        server: 'relationships',
        parameters: {
          from_id: { type: 'string', description: '起始人物 ID', required: true },
          to_id: { type: 'string', description: '目标人物 ID', required: true },
        },
      },
    ],
  },
]

// ─── 工具意图识别 ───────────────────────────────────────────

/**
 * 分析用户查询，判断需要调用哪些 MCP 工具
 * FIX: 动态人物匹配 + 激活所有已定义工具
 */
export async function planToolCalls(query: string): Promise<MCPToolCall[]> {
  const plannedCalls: MCPToolCall[] = []

  // 日历相关
  if (/周五|周几|什么时候|有空|日程|安排|下周|这周|明天|今天|忙|闲/.test(query)) {
    plannedCalls.push({
      id: `mcp-cal-${Date.now()}`,
      tool: MCP_SERVERS[0].tools[0],
      arguments: { days: 7 },
      result: null,
      timestamp: Date.now(),
      duration: 0,
      success: false,
    })
  }

  // FIX: find_free_time — 查找空闲时间
  if (/有空|空闲|抽.*时间|腾.*时间|有没有时间|哪天.*方便/.test(query)) {
    plannedCalls.push({
      id: `mcp-cal-ft-${Date.now()}`,
      tool: MCP_SERVERS[0].tools[1],
      arguments: { duration_minutes: 60 },
      result: null,
      timestamp: Date.now(),
      duration: 0,
      success: false,
    })
  }

  // FIX: 动态人物匹配 — 从数据库加载所有人物，按名字匹配
  const allPeople = await db.persons.toArray()
  const matchedPerson = allPeople.find(p => query.includes(p.name))
  if (matchedPerson) {
    plannedCalls.push({
      id: `mcp-con-${Date.now()}`,
      tool: MCP_SERVERS[1].tools[0],
      arguments: { name: matchedPerson.name },
      result: null,
      timestamp: Date.now(),
      duration: 0,
      success: false,
    })

    // FIX: get_person_detail — 查询人物详情
    if (/详情|详细|信息|介绍|是谁|什么人/.test(query)) {
      plannedCalls.push({
        id: `mcp-con-d-${Date.now()}`,
        tool: MCP_SERVERS[1].tools[1],
        arguments: { person_id: matchedPerson.id },
        result: null,
        timestamp: Date.now(),
        duration: 0,
        success: false,
      })
    }
  }

  // 日记相关
  if (/上次|之前|记得|以前|历史|日记/.test(query)) {
    const keyword = query.replace(/上次|之前|记得|以前|历史|日记/g, '').trim().slice(0, 20)
    plannedCalls.push({
      id: `mcp-jou-${Date.now()}`,
      tool: MCP_SERVERS[2].tools[0],
      arguments: { keyword: keyword || '最近', limit: 3 },
      result: null,
      timestamp: Date.now(),
      duration: 0,
      success: false,
    })
  }

  // 关系图谱相关
  if (/关系|认识|介绍|人脉|谁.*能/.test(query)) {
    plannedCalls.push({
      id: `mcp-rel-${Date.now()}`,
      tool: MCP_SERVERS[3].tools[0],
      arguments: {},
      result: null,
      timestamp: Date.now(),
      duration: 0,
      success: false,
    })
  }

  // FIX: find_connection_path — 查找关系路径
  if (/怎么.*认识|通过.*介绍|关系链|路径|怎么.*联系上/.test(query)) {
    const peopleInQuery = allPeople.filter(p => query.includes(p.name))
    if (peopleInQuery.length >= 2) {
      plannedCalls.push({
        id: `mcp-rel-fp-${Date.now()}`,
        tool: MCP_SERVERS[3].tools[1],
        arguments: { from_id: peopleInQuery[0].id, to_id: peopleInQuery[1].id },
        result: null,
        timestamp: Date.now(),
        duration: 0,
        success: false,
      })
    }
  }

  return plannedCalls
}

// ─── 工具执行 ───────────────────────────────────────────────

/**
 * 执行 MCP 工具调用
 */
export async function executeToolCall(call: MCPToolCall): Promise<MCPToolCall> {
  const start = Date.now()

  try {
    let result: unknown

    switch (call.tool.name) {
      case 'get_upcoming_events':
        result = await queryCalendar(call.arguments.days as number || 7)
        break

      case 'find_free_time':
        result = await findFreeTime(call.arguments.duration_minutes as number || 60)
        break

      case 'search_person':
        result = await searchContact(call.arguments.name as string)
        break

      case 'get_person_detail':
        result = await getPersonDetail(call.arguments.person_id as string)
        break

      case 'search_journal':
        result = await searchJournal(call.arguments.keyword as string, call.arguments.limit as number || 3)
        break

      case 'get_relationships':
        result = await getRelationships()
        break

      case 'find_connection_path':
        result = await findConnectionPath(call.arguments.from_id as string, call.arguments.to_id as string)
        break

      default:
        throw new Error(`Unknown tool: ${call.tool.name}`)
    }

    return {
      ...call,
      result,
      duration: Date.now() - start,
      success: true,
    }
  } catch (error) {
    return {
      ...call,
      result: null,
      duration: Date.now() - start,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ─── 真实工具实现 ──────────────────────────────────────────

/**
 * 日历查询：从手动提醒 + AI 生成的提醒中提取日程
 */
async function queryCalendar(days: number) {
  const events: Array<{ date: string; title: string; type: string }> = []
  const now = Date.now()
  const dayMs = 86400000

  // 从手动提醒获取
  const manualReminders = getManualReminders()
  for (const r of manualReminders) {
    if (r.dueDate && r.dueDate >= now && r.dueDate <= now + days * dayMs) {
      const d = new Date(r.dueDate)
      events.push({
        date: `${d.getMonth() + 1}月${d.getDate()}日`,
        title: r.title,
        type: r.type === 'task' ? 'meeting' : r.type,
      })
    }
  }

  // 从 AI 生成的提醒获取
  try {
    const aiReminders = await generateReminders()
    for (const r of aiReminders) {
      if (r.dueDate && r.dueDate >= now && r.dueDate <= now + days * dayMs) {
        const d = new Date(r.dueDate)
        events.push({
          date: `${d.getMonth() + 1}月${d.getDate()}日`,
          title: r.title,
          type: r.type === 'task' ? 'meeting' : r.type,
        })
      }
    }
  } catch {
    // AI 提醒生成失败不影响手动提醒
  }

  // 按日期排序
  events.sort((a, b) => a.date.localeCompare(b.date))

  return { events: events.slice(0, days), total: events.length }
}

/**
 * 查找空闲时间：基于已有日程找空档
 */
async function findFreeTime(durationMinutes: number) {
  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  const slots: Array<{ date: string; start: string; end: string }> = []

  // 简单策略：检查未来3天的手动提醒，找出没有安排的时段
  const manualReminders = getManualReminders()
  const busyDates = new Set(
    manualReminders
      .filter(r => r.dueDate && r.dueDate >= Date.now() && r.dueDate <= Date.now() + 3 * 86400000)
      .map(r => new Date(r.dueDate!).toISOString().slice(0, 10))
  )

  for (let i = 0; i < 3; i++) {
    const date = new Date(now)
    date.setDate(date.getDate() + i)
    const dateStr = date.toISOString().slice(0, 10)
    if (!busyDates.has(dateStr)) {
      slots.push({
        date: `${date.getMonth() + 1}月${date.getDate()}日`,
        start: '09:00',
        end: `${Math.min(21, 9 + Math.ceil(durationMinutes / 60))}:00`,
      })
    }
  }

  return { durationMinutes, availableSlots: slots, total: slots.length }
}

/**
 * 通讯录搜索：从 IndexedDB 查询真实人物
 */
async function searchContact(name: string) {
  const allPeople = await db.persons.toArray()
  const matched = allPeople.filter(p => p.name.includes(name))
  return {
    found: matched.length > 0,
    people: matched.map(p => ({
      id: p.id,
      name: p.name,
      relationship: p.relationship,
      sentiment: p.sentiment,
      company: p.profile?.career?.company || p.company || '',
    })),
  }
}

/**
 * 获取人物详情：从 IndexedDB 查询完整档案
 */
async function getPersonDetail(personId: string) {
  const person = await db.persons.get(personId)
  if (!person) return { found: false }
  return {
    found: true,
    person: {
      id: person.id,
      name: person.name,
      sentiment: person.sentiment,
      description: person.description,
      tags: person.tags,
      lastInteractionDays: person.lastInteractionDays,
    },
  }
}

/**
 * 日记搜索：从 IndexedDB 查询真实日记
 */
async function searchJournal(keyword: string, limit: number) {
  const diaries = await db.diaries.toArray()
  const matched = diaries
    .filter(d => (d.content || '').includes(keyword))
    .slice(0, limit)
  return {
    keyword,
    results: matched.map(d => ({
      date: d.date,
      mood: d.mood,
      preview: (d.content || '').slice(0, 100),
    })),
    total: matched.length,
  }
}

/**
 * 获取关系网络统计：从 IndexedDB 查询真实数据
 */
async function getRelationships() {
  const allPeople = await db.persons.toArray()
  return {
    totalPeople: allPeople.length,
    byCategory: {
      family: allPeople.filter(p => p.relationship === 'family').length,
      colleague: allPeople.filter(p => p.relationship === 'colleague').length,
      friend: allPeople.filter(p => p.relationship === 'friend').length,
      client: allPeople.filter(p => p.relationship === 'client').length,
      other: allPeople.filter(p => p.relationship === 'other').length,
    },
  }
}

/**
 * FIX: 查找关系路径 — 接入 GraphRAG 的 BFS 遍历
 */
async function findConnectionPath(fromId: string, toId: string) {
  const allPeople = await db.persons.toArray()
  const fromPerson = allPeople.find(p => p.id === fromId)
  const toPerson = allPeople.find(p => p.id === toId)

  if (!fromPerson || !toPerson) {
    return { from: fromId, to: toId, pathFound: false, path: [], hops: 0 }
  }

  // 使用 GraphRAG 的邻接表 + BFS 遍历查找路径
  const adjacency = await buildAdjacencyList()
  const paths = bfsGraphTraversal([fromId], 3, adjacency, allPeople)

  // 找到包含 toId 的路径
  const matchingPath = paths.find(p => p.nodeIds.includes(toId))

  if (!matchingPath) {
    return {
      from: fromPerson.name,
      to: toPerson.name,
      pathFound: false,
      path: [],
      hops: 0,
      message: `未找到 ${fromPerson.name} 到 ${toPerson.name} 的关系路径（3跳以内）`,
    }
  }

  // 构建可读路径
  const pathNames = matchingPath.nodeIds.map(id => {
    const p = allPeople.find(person => person.id === id)
    return p?.name || id
  })

  return {
    from: fromPerson.name,
    to: toPerson.name,
    pathFound: true,
    path: pathNames,
    hops: matchingPath.edges.length,
    edges: matchingPath.edges.map(e => ({
      type: e.relationType,
      strength: e.strength,
    })),
    description: matchingPath.description || pathNames.join(' → '),
  }
}

// ─── 完整 MCP 调用流程 ──────────────────────────────────────

/**
 * MCP 工具调用完整流程
 * 1. 分析查询，规划工具调用
 * 2. 并行执行所有工具调用
 * 3. 返回工具调用结果和增强上下文
 */
export async function runMCPTools(
  query: string,
): Promise<{
  calls: MCPToolCall[]
  enhancedContext: string
}> {
  const plannedCalls = await planToolCalls(query)

  if (plannedCalls.length === 0) {
    return { calls: [], enhancedContext: '' }
  }

  // 并行执行所有工具调用
  const executedCalls = await Promise.all(
    plannedCalls.map(call => executeToolCall(call))
  )

  // 构建增强上下文
  const contextParts: string[] = ['【MCP 工具调用结果】']

  for (const call of executedCalls) {
    if (!call.success) continue

    contextParts.push(`\n[${call.tool.server}] ${call.tool.name}:`)

    if (call.tool.name === 'get_upcoming_events' && call.result) {
      const result = call.result as { events: Array<{ date: string; title: string; type: string }> }
      contextParts.push(`未来 ${result.events.length} 个日程：`)
      result.events.forEach(e => contextParts.push(`  - ${e.date} ${e.title} (${e.type})`))
    }

    if (call.tool.name === 'find_free_time' && call.result) {
      const result = call.result as { availableSlots: Array<{ date: string; start: string; end: string }> }
      if (result.availableSlots.length > 0) {
        contextParts.push(`找到 ${result.availableSlots.length} 个空闲时段：`)
        result.availableSlots.forEach(s => contextParts.push(`  - ${s.date} ${s.start}-${s.end}`))
      } else {
        contextParts.push('未来3天没有完全空闲的时段')
      }
    }

    if (call.tool.name === 'search_person' && call.result) {
      const result = call.result as { found: boolean; people: Array<{ name: string; sentiment: number; relationship: string }> }
      if (result.found) {
        result.people.forEach(p => {
          contextParts.push(`  - ${p.name}：${p.relationship}，温度 ${p.sentiment}°`)
        })
      }
    }

    if (call.tool.name === 'get_person_detail' && call.result) {
      const result = call.result as { found: boolean; person?: { name: string; description: string; tags: string[] } }
      if (result.found && result.person) {
        contextParts.push(`  - ${result.person.name}：${result.person.description?.slice(0, 50) || '无描述'}`)
        if (result.person.tags?.length) {
          contextParts.push(`  - 标签：${result.person.tags.join(', ')}`)
        }
      }
    }

    if (call.tool.name === 'search_journal' && call.result) {
      const result = call.result as { results: Array<{ date: string; preview: string }> }
      if (result.results.length > 0) {
        contextParts.push(`找到 ${result.results.length} 条相关日记：`)
        result.results.forEach(r => contextParts.push(`  - ${r.date}: ${r.preview}`))
      }
    }

    if (call.tool.name === 'get_relationships' && call.result) {
      const result = call.result as { totalPeople: number; byCategory: Record<string, number> }
      contextParts.push(`关系网络：共 ${result.totalPeople} 人`)
      Object.entries(result.byCategory).forEach(([cat, count]) => {
        contextParts.push(`  - ${cat}: ${count} 人`)
      })
    }

    if (call.tool.name === 'find_connection_path' && call.result) {
      const result = call.result as { pathFound: boolean; path: string[]; hops: number; description?: string; message?: string }
      if (result.pathFound) {
        contextParts.push(`关系路径（${result.hops}跳）：${result.description || result.path.join(' → ')}`)
      } else {
        contextParts.push(result.message || '未找到关系路径')
      }
    }
  }

  return {
    calls: executedCalls,
    enhancedContext: contextParts.join('\n'),
  }
}
