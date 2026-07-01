import { db } from '../lib/db'
import { guardWrite, isDemoMode } from '../lib/demoGuard'
import type { Conversation } from '../types'

export const conversationRepository = {
  async getAll(): Promise<Conversation[]> {
    return db.conversations.toArray()
  },

  async getById(id: number): Promise<Conversation | undefined> {
    return db.conversations.get(id)
  },

  async add(conversation: Omit<Conversation, 'id'>): Promise<number> {
    // FIX: 演示模式下允许对话（会话是临时体验），但不持久化
    if (isDemoMode()) {
      // 返回一个假 ID，让 UI 正常工作
      return Math.floor(Math.random() * 1000000) + 1
    }
    return db.conversations.add(conversation) as Promise<number>
  },

  async update(id: number, changes: Partial<Conversation>): Promise<void> {
    if (isDemoMode()) return // 演示模式下静默跳过
    await db.conversations.update(id, changes)
  },

  async delete(id: number): Promise<void> {
    if (isDemoMode()) return // 演示模式下静默跳过
    await db.conversations.delete(id)
  },

  async clear(): Promise<void> {
    guardWrite('清空对话数据')
    await db.conversations.clear()
  },

  async count(): Promise<number> {
    return db.conversations.count()
  },
}
