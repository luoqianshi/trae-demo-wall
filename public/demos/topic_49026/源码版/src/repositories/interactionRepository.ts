import { db } from '../lib/db'
import type { Interaction } from '../types'

export const interactionRepository = {
  async getAll(): Promise<Interaction[]> {
    return db.interactions.toArray()
  },

  async getById(id: string): Promise<Interaction | undefined> {
    return db.interactions.get(id)
  },

  async add(interaction: Interaction): Promise<void> {
    await db.interactions.add(interaction)
  },

  async bulkAdd(interactions: Interaction[]): Promise<void> {
    if (interactions.length === 0) return
    await db.interactions.bulkAdd(interactions)
  },

  async update(id: string, changes: Partial<Interaction>): Promise<void> {
    await db.interactions.update(id, changes)
  },

  async delete(id: string): Promise<void> {
    await db.interactions.delete(id)
  },

  async clear(): Promise<void> {
    await db.interactions.clear()
  },

  async count(): Promise<number> {
    return db.interactions.count()
  },
}
