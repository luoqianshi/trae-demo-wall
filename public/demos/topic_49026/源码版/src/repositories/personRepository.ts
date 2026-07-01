import { db } from '../lib/db'
import { guardWrite } from '../lib/demoGuard'
import type { Person } from '../types'

/** 轻量人物信息 — 用于列表页、侧边栏、关系图谱，避免加载完整 profile/timeline/connections */
export interface PersonCore {
  id: string
  name: string
  relationship: Person['relationship']
  sentiment: number
  tags: string[]
  isDemo?: number
  createdAt: number
  updatedAt: number
}

/** 从完整 Person 对象提取核心字段 */
function toPersonCore(p: Person): PersonCore {
  return {
    id: p.id,
    name: p.name,
    relationship: p.relationship,
    sentiment: p.sentiment,
    tags: p.tags || [],
    isDemo: p.isDemo,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }
}

export const personRepository = {
  async getAll(): Promise<Person[]> {
    return db.persons.toArray()
  },

  /**
   * 获取轻量人物列表 — 仅加载核心字段（~200 bytes/人 vs 8-15KB/人）
   * 用于列表页、侧边栏、关系图谱等不需要完整 profile 的场景
   */
  async getCoreList(): Promise<PersonCore[]> {
    const all = await db.persons.toArray()
    return all.map(toPersonCore)
  },

  async getById(id: string): Promise<Person | undefined> {
    return db.persons.get(id)
  },

  async add(person: Person): Promise<void> {
    guardWrite('新增人物')
    await db.persons.add(person)
  },

  async bulkAdd(persons: Person[]): Promise<void> {
    if (persons.length === 0) return
    guardWrite('批量新增人物')
    await db.persons.bulkAdd(persons)
  },

  async update(id: string, changes: Partial<Person>): Promise<void> {
    guardWrite('修改人物')
    await db.persons.update(id, changes)
  },

  async delete(id: string): Promise<void> {
    guardWrite('删除人物')
    await db.persons.delete(id)
  },

  async clear(): Promise<void> {
    guardWrite('清空人物数据')
    await db.persons.clear()
  },

  async count(): Promise<number> {
    return db.persons.count()
  },
}
