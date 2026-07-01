/**
 * Demo Guard — 公开演示环境数据保护
 *
 * 三层防护：
 * 1. 只读拦截：演示模式下拦截所有写操作（add/update/delete/clear）
 * 2. 会话隔离：访客产生的对话等临时数据存入 sessionStorage，不污染 IndexedDB
 * 3. 自动恢复：页面加载时校验演示数据完整性，被篡改则自动恢复
 *
 * 激活方式：URL 参数 ?demo=1 或环境变量 VITE_DEMO_MODE=true
 */

import { db } from './db'

const DEMO_URL_PARAM = 'demo'
const DEMO_ENV_KEY = 'VITE_DEMO_MODE'
const DEMO_INTEGRITY_KEY = 'hengzhou-demo-integrity-checked'

// 演示数据预期数量（用于完整性校验）
const EXPECTED_DEMO_COUNTS = {
  persons: 8,   // PEOPLE 数组长度
  memories: 30, // MEMORIES 数组长度（含健康记忆）
  diaries: 5,   // DIARIES 数组长度
}

/**
 * 检测当前是否处于演示模式
 */
export function isDemoMode(): boolean {
  // 环境变量优先
  const envDemo = import.meta.env?.[DEMO_ENV_KEY]
  if (envDemo === 'true' || envDemo === '1') return true

  // URL 参数 ?demo=1
  try {
    const params = new URLSearchParams(window.location.search)
    return params.get(DEMO_URL_PARAM) === '1'
  } catch {
    return false
  }
}

/**
 * 写操作守卫 —— 演示模式下拦截写操作
 * @param operation 操作描述，用于错误消息
 * @throws Error 演示模式下抛出友好错误
 */
export function guardWrite(operation: string): void {
  if (isDemoMode()) {
    throw new DemoGuardError(`演示模式下不允许${operation}，数据为只读保护状态`)
  }
}

/**
 * 演示守卫错误类
 */
export class DemoGuardError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DemoGuardError'
  }
}

/**
 * 校验演示数据完整性
 * @returns { ok: boolean, details: Record<string, {expected: number, actual: number}> }
 */
export async function checkDemoIntegrity(): Promise<{
  ok: boolean
  details: Record<string, { expected: number; actual: number }>
}> {
  const details: Record<string, { expected: number; actual: number }> = {}

  const [personCount, memoryCount, diaryCount] = await Promise.all([
    db.persons.where('isDemo').equals(1).count(),
    db.memories.where('isDemo').equals(1).count(),
    db.diaries.where('isDemo').equals(1).count(),
  ])

  details.persons = { expected: EXPECTED_DEMO_COUNTS.persons, actual: personCount }
  details.memories = { expected: EXPECTED_DEMO_COUNTS.memories, actual: memoryCount }
  details.diaries = { expected: EXPECTED_DEMO_COUNTS.diaries, actual: diaryCount }

  const ok = personCount >= EXPECTED_DEMO_COUNTS.persons
    && memoryCount >= EXPECTED_DEMO_COUNTS.memories
    && diaryCount >= EXPECTED_DEMO_COUNTS.diaries

  return { ok, details }
}

/**
 * 恢复演示数据 —— 重新播种
 */
export async function restoreDemoData(): Promise<void> {
  console.warn('[DemoGuard] 检测到演示数据被篡改，正在恢复...')
  try {
    // 动态导入避免循环依赖
    const { seedDemoData } = await import('./demoData')
    await seedDemoData()
    sessionStorage.setItem(DEMO_INTEGRITY_KEY, Date.now().toString())
    console.log('[DemoGuard] 演示数据已恢复')
  } catch (err) {
    console.error('[DemoGuard] 恢复演示数据失败:', err)
  }
}

/**
 * 初始化演示守卫 —— 在 App 加载时调用
 * 检查完整性，被篡改则自动恢复
 */
export async function initDemoGuard(): Promise<void> {
  if (!isDemoMode()) return

  console.log('[DemoGuard] 演示模式已激活，数据写入将被保护')

  // 防止短时间内重复检查
  const lastCheck = sessionStorage.getItem(DEMO_INTEGRITY_KEY)
  if (lastCheck && Date.now() - parseInt(lastCheck, 10) < 60_000) {
    console.log('[DemoGuard] 60 秒内已检查过完整性，跳过')
    return
  }

  try {
    const { ok, details } = await checkDemoIntegrity()
    console.log('[DemoGuard] 数据完整性检查:', JSON.stringify(details))

    if (!ok) {
      await restoreDemoData()
    } else {
      sessionStorage.setItem(DEMO_INTEGRITY_KEY, Date.now().toString())
    }
  } catch (err) {
    console.error('[DemoGuard] 初始化检查失败:', err)
  }
}

/**
 * 安全执行写操作 —— 演示模式下拦截，非演示模式正常执行
 */
export async function safeWrite<T>(operation: string, fn: () => Promise<T>): Promise<T> {
  guardWrite(operation)
  return fn()
}
