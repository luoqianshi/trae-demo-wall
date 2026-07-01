// 轻量级埋点系统
// 记录用户行为和LLM性能指标，存入localStorage供调试分析

interface AnalyticsEvent {
  id: string
  timestamp: number
  type: 'user_action' | 'llm_call' | 'error' | 'performance'
  name: string
  data?: Record<string, any>
  duration?: number // 耗时ms
}

const STORAGE_KEY = 'hengzhou-analytics'
const MAX_EVENTS = 500

function generateEventId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function getStoredEvents(): AnalyticsEvent[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function saveEvents(events: AnalyticsEvent[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(-MAX_EVENTS)))
}

// 记录事件
export function trackEvent(
  type: AnalyticsEvent['type'],
  name: string,
  data?: Record<string, any>,
  duration?: number
) {
  const event: AnalyticsEvent = {
    id: generateEventId(),
    timestamp: Date.now(),
    type,
    name,
    data,
    duration,
  }

  const events = getStoredEvents()
  events.push(event)
  saveEvents(events)

  // 开发环境控制台输出
  if (import.meta.env.DEV) {
    console.log(`[Analytics] ${type}: ${name}`, data, duration ? `${duration}ms` : '')
  }
}

// 便捷方法
export const track = {
  // 用户行为
  action: (name: string, data?: Record<string, any>) =>
    trackEvent('user_action', name, data),

  // LLM调用
  llm: (name: string, data: { model?: string; tokens?: number; success: boolean }, duration: number) =>
    trackEvent('llm_call', name, data, duration),

  // 错误
  error: (name: string, data?: Record<string, any>) =>
    trackEvent('error', name, data),

  // 性能
  perf: (name: string, duration: number, data?: Record<string, any>) =>
    trackEvent('performance', name, data, duration),
}

// 获取统计数据
export function getAnalyticsSummary(): {
  totalEvents: number
  llmCalls: number
  llmAvgLatency: number
  llmSuccessRate: number
  userActions: Record<string, number>
  errors: number
} {
  const events = getStoredEvents()
  const llmEvents = events.filter(e => e.type === 'llm_call')
  const errorEvents = events.filter(e => e.type === 'error')
  const actionEvents = events.filter(e => e.type === 'user_action')

  const llmLatencies = llmEvents.map(e => e.duration || 0).filter(d => d > 0)
  const llmAvgLatency = llmLatencies.length > 0
    ? llmLatencies.reduce((a, b) => a + b, 0) / llmLatencies.length
    : 0

  const llmSuccess = llmEvents.filter(e => e.data?.success).length

  const userActions: Record<string, number> = {}
  actionEvents.forEach(e => {
    userActions[e.name] = (userActions[e.name] || 0) + 1
  })

  return {
    totalEvents: events.length,
    llmCalls: llmEvents.length,
    llmAvgLatency: Math.round(llmAvgLatency),
    llmSuccessRate: llmEvents.length > 0 ? Math.round((llmSuccess / llmEvents.length) * 100) : 0,
    userActions,
    errors: errorEvents.length,
  }
}

// 导出原始数据（用于调试面板）
export function exportAnalytics(): AnalyticsEvent[] {
  return getStoredEvents()
}

// 清空数据
export function clearAnalytics() {
  localStorage.removeItem(STORAGE_KEY)
}
