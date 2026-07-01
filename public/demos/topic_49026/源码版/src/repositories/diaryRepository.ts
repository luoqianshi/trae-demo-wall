import { db } from '../lib/db'
import { guardWrite } from '../lib/demoGuard'
import type { DiaryEntry } from '../types'

export const diaryRepository = {
  async getAll(): Promise<DiaryEntry[]> {
    return db.diaries.toArray()
  },

  async getById(id: string): Promise<DiaryEntry | undefined> {
    return db.diaries.get(id)
  },

  async add(diary: DiaryEntry): Promise<void> {
    guardWrite('新增日记')
    await db.diaries.add(diary)
  },

  async bulkAdd(diaries: DiaryEntry[]): Promise<void> {
    if (diaries.length === 0) return
    guardWrite('批量新增日记')
    await db.diaries.bulkAdd(diaries)
  },

  async update(id: string, changes: Partial<DiaryEntry>): Promise<void> {
    guardWrite('修改日记')
    await db.diaries.update(id, changes)
  },

  async delete(id: string): Promise<void> {
    guardWrite('删除日记')
    await db.diaries.delete(id)
  },

  async clear(): Promise<void> {
    guardWrite('清空日记数据')
    await db.diaries.clear()
  },

  async count(): Promise<number> {
    return db.diaries.count()
  },
}
