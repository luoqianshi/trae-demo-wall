import { db } from '../lib/db'
import { guardWrite } from '../lib/demoGuard'
import type { Memory } from '../types'

export const memoryRepository = {
  async getAll(): Promise<Memory[]> {
    return db.memories.toArray()
  },

  async getById(id: string): Promise<Memory | undefined> {
    return db.memories.get(id)
  },

  async add(memory: Memory): Promise<void> {
    guardWrite('新增记忆')
    await db.memories.add(memory)
  },

  async bulkAdd(memories: Memory[]): Promise<void> {
    if (memories.length === 0) return
    guardWrite('批量新增记忆')
    await db.memories.bulkAdd(memories)
  },

  async update(id: string, changes: Partial<Memory>): Promise<void> {
    guardWrite('修改记忆')
    await db.memories.update(id, changes)
  },

  async delete(id: string): Promise<void> {
    guardWrite('删除记忆')
    await db.memories.delete(id)
  },

  async clear(): Promise<void> {
    guardWrite('清空记忆数据')
    await db.memories.clear()
  },

  async count(): Promise<number> {
    return db.memories.count()
  },

  async getPending(): Promise<Memory[]> {
    return db.memories.toArray().then((list) => list.filter((m) => !m.confirmed))
  },
}
