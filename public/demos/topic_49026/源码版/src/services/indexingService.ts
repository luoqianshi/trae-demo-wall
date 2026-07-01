import { indexMemory, indexPerson, indexDiary } from '../lib/vectorStore'

export const indexingService = {
  async indexMemory(id: string, content: string): Promise<void> {
    try {
      await indexMemory({ id, content })
    } catch (e) {
      console.warn('[IndexingService] memory index failed:', e instanceof Error ? e.message : String(e))
    }
  },

  async indexPerson(id: string, name: string, traits: string[], profileText: string): Promise<void> {
    try {
      await indexPerson({ id, name, traits, profileText })
    } catch (e) {
      console.warn('[IndexingService] person index failed:', e instanceof Error ? e.message : String(e))
    }
  },

  async indexDiary(id: string, content: string): Promise<void> {
    try {
      await indexDiary({ id, content })
    } catch (e) {
      console.warn('[IndexingService] diary index failed:', e instanceof Error ? e.message : String(e))
    }
  },
}
