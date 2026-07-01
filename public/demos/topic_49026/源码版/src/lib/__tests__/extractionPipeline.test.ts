import { describe, it, expect, vi, beforeEach } from 'vitest'
import { extractMemoriesFromConversation, saveExtractedMemories } from '../memoryExtractor'
import { dataSyncService } from '../../services'
import * as ai from '../ai'

vi.mock('../ai', () => ({ chat: vi.fn(), getEmbedding: vi.fn().mockResolvedValue([]) }))

vi.mock('../../repositories', () => ({
  personRepository: {
    getAll: vi.fn().mockResolvedValue([]),
  },
  memoryRepository: {
    getAll: vi.fn().mockResolvedValue([]),
    getById: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('../../services', () => ({
  dataSyncService: {
    saveMemory: vi.fn().mockImplementation(async (memory) => ({
      ...memory,
      id: 'm1',
      createdAt: Date.now(),
    })),
    updateMemory: vi.fn(),
    savePerson: vi.fn(),
    updatePerson: vi.fn(),
    saveDiary: vi.fn(),
    deleteMemory: vi.fn(),
  },
  onDataChange: vi.fn(),
}))

describe('extraction pipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should save medium confidence memory as pending', async () => {
    vi.mocked(ai.chat).mockResolvedValueOnce(
      JSON.stringify({
        memories: [
          {
            type: 'event',
            content: '用户提到明天要见客户',
            confidence: 'medium',
            reason: '用户明确提及',
          },
        ],
        people_mentioned: [],
        topics: [],
        emotions: [],
      })
    )

    const extraction = await extractMemoriesFromConversation('明天要见客户', '加油')
    const saved = await saveExtractedMemories(extraction, 'test-conversation')

    expect(saved).toHaveLength(1)
    expect(dataSyncService.saveMemory).toHaveBeenCalledWith(
      expect.objectContaining({ confirmed: false })
    )
  })

  it('should save high confidence memory as confirmed', async () => {
    vi.mocked(ai.chat).mockResolvedValueOnce(
      JSON.stringify({
        memories: [
          {
            type: 'event',
            content: '用户是杭州云启科技有限公司运营总监',
            confidence: 'high',
            reason: '用户直接陈述',
          },
        ],
        people_mentioned: [],
        topics: [],
        emotions: [],
      })
    )

    const extraction = await extractMemoriesFromConversation('我是杭州云启科技有限公司运营总监', '了解')
    await saveExtractedMemories(extraction, 'test-conversation')

    expect(dataSyncService.saveMemory).toHaveBeenCalledWith(
      expect.objectContaining({ confirmed: true })
    )
  })
})
