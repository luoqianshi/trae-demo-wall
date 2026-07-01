/**
 * 数据生命周期管理 — 自动清理过期数据，防止存储无限增长
 *
 * 企业级技术降维：Redis TTL / Cassandra TTL → 浏览器端 IndexedDB 数据过期
 *
 * 清理策略：
 * - 对话记录：30天前的对话自动归档/删除
 * - Agent 任务：已完成任务 7 天后自动清理
 * - 语义缓存：10分钟 TTL 过期条目主动删除（queryCache.ts 内已实现）
 * - 向量索引重建：重建前先清理旧索引（vectorStore.ts 内已实现）
 */

import { db } from './db'

const CLEANUP_INTERVAL = 60 * 60 * 1000 // 每小时检查一次
const CONVERSATION_RETENTION_DAYS = 30
const AGENT_TASK_RETENTION_DAYS = 7

let cleanupTimer: ReturnType<typeof setInterval> | null = null
let lastCleanupAt = 0

/**
 * 执行一次数据清理
 * 返回各表清理的记录数
 */
export async function runDataCleanup(): Promise<{
  conversations: number
  agentTasks: number
  queryCache: number
}> {
  const now = Date.now()
  const conversationCutoff = now - CONVERSATION_RETENTION_DAYS * 24 * 60 * 60 * 1000
  const agentTaskCutoff = now - AGENT_TASK_RETENTION_DAYS * 24 * 60 * 60 * 1000

  const results = {
    conversations: 0,
    agentTasks: 0,
    queryCache: 0,
  }

  try {
    // 清理旧对话记录
    const oldConversations = await db.conversations
      .where('timestamp')
      .below(conversationCutoff)
      .toArray()
    if (oldConversations.length > 0) {
      await db.conversations.bulkDelete(
        oldConversations.map(c => c.id!).filter(Boolean)
      )
      results.conversations = oldConversations.length
      console.log(`[DataLifecycle] 清理 ${oldConversations.length} 条过期对话`)
    }
  } catch (err) {
    console.warn('[DataLifecycle] 清理对话失败:', err)
  }

  try {
    // 清理已完成的 Agent 任务
    const completedTasks = await db.agentTasks
      .where('status')
      .anyOf('completed', 'failed')
      .toArray()
    const oldTasks = completedTasks.filter(
      t => t.completedAt && t.completedAt < agentTaskCutoff
    )
    if (oldTasks.length > 0) {
      await db.agentTasks.bulkDelete(oldTasks.map(t => t.id))
      results.agentTasks = oldTasks.length
      console.log(`[DataLifecycle] 清理 ${oldTasks.length} 条已完成 Agent 任务`)
    }
  } catch (err) {
    console.warn('[DataLifecycle] 清理 Agent 任务失败:', err)
  }

  try {
    // 清理过期的语义缓存
    const cacheCutoff = now - 10 * 60 * 1000 // 10 分钟 TTL
    const expiredCache = await db.queryCache
      .where('timestamp')
      .below(cacheCutoff)
      .toArray()
    if (expiredCache.length > 0) {
      await db.queryCache.bulkDelete(
        expiredCache.map(c => c.id!).filter(Boolean)
      )
      results.queryCache = expiredCache.length
      console.log(`[DataLifecycle] 清理 ${expiredCache.length} 条过期缓存`)
    }
  } catch (err) {
    console.warn('[DataLifecycle] 清理缓存失败:', err)
  }

  lastCleanupAt = now
  return results
}

/**
 * 启动定时清理任务
 * 每小时检查一次，应用启动时自动调用
 */
export function startDataLifecycleManager() {
  if (cleanupTimer) return

  // 首次启动延迟 30 秒执行，避免与应用初始化竞争
  setTimeout(() => {
    runDataCleanup().catch(err =>
      console.warn('[DataLifecycle] 首次清理失败:', err)
    )
  }, 30 * 1000)

  // 定时清理
  cleanupTimer = setInterval(() => {
    runDataCleanup().catch(err =>
      console.warn('[DataLifecycle] 定时清理失败:', err)
    )
  }, CLEANUP_INTERVAL)

  console.log('[DataLifecycle] 数据生命周期管理已启动（每小时检查）')
}

/**
 * 停止定时清理任务
 */
export function stopDataLifecycleManager() {
  if (cleanupTimer) {
    clearInterval(cleanupTimer)
    cleanupTimer = null
    console.log('[DataLifecycle] 数据生命周期管理已停止')
  }
}

/**
 * 获取上次清理时间和下次清理时间
 */
export function getCleanupStatus(): {
  lastCleanupAt: number
  nextCleanupIn: number
} {
  const nextCleanupIn = cleanupTimer
    ? Math.max(0, CLEANUP_INTERVAL - (Date.now() - lastCleanupAt))
    : 0
  return { lastCleanupAt, nextCleanupIn }
}
