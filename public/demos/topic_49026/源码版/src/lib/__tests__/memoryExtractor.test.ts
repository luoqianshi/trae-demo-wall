import { describe, it, expect, vi, beforeEach } from 'vitest'
import { extractMemoriesFromConversation } from '../memoryExtractor'
import * as ai from '../ai'

vi.mock('../ai', () => ({ chat: vi.fn() }))

describe('memoryExtractor robustness', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('should parse JSON wrapped in markdown code block', async () => {
    vi.mocked(ai.chat).mockResolvedValueOnce('```json\n{"memories":[],"people_mentioned":[],"topics":[],"emotions":[]}\n```')
    const result = await extractMemoriesFromConversation('hello', 'hi')
    expect(result.memories).toEqual([])
  })

  it('should repair broken JSON by extracting first object', async () => {
    vi.mocked(ai.chat).mockResolvedValueOnce('some text before {"memories":[{"type":"event","content":"test","confidence":"high"}],"people_mentioned":[],"topics":[],"emotions":[]} trailing')
    const result = await extractMemoriesFromConversation('hello', 'hi')
    expect(result.memories).toHaveLength(1)
    expect(result.memories[0].content).toBe('test')
  })

  it('should retry when first response is invalid and retry succeeds', async () => {
    vi.mocked(ai.chat)
      .mockResolvedValueOnce('not valid json')
      .mockResolvedValueOnce('{"memories":[{"type":"insight","content":"ok","confidence":"medium"}],"people_mentioned":[],"topics":[],"emotions":[]}')
    const result = await extractMemoriesFromConversation('hello', 'hi')
    expect(result.memories).toHaveLength(1)
    expect(ai.chat).toHaveBeenCalledTimes(2)
  })

  it('should return empty result when retry also fails', async () => {
    vi.mocked(ai.chat).mockResolvedValue('still not json')
    const result = await extractMemoriesFromConversation('hello', 'hi')
    expect(result.memories).toEqual([])
    expect(ai.chat).toHaveBeenCalledTimes(2)
  })

  it('should filter out invalid memory items', async () => {
    vi.mocked(ai.chat).mockResolvedValueOnce('{"memories":[{"type":"event","content":"valid","confidence":"high"},{"content":"missing fields"}],"people_mentioned":[],"topics":[],"emotions":[]}')
    const result = await extractMemoriesFromConversation('hello', 'hi')
    expect(result.memories).toHaveLength(1)
    expect(result.memories[0].content).toBe('valid')
  })

  it('filters invalid memory types', async () => {
    vi.mocked(ai.chat).mockResolvedValueOnce(
      '{"memories":[{"type":"invalid","content":"x","confidence":"high"},{"type":"event","content":"valid","confidence":"high"}],"people_mentioned":[],"topics":[],"emotions":[]}'
    )
    const result = await extractMemoriesFromConversation('hi', 'hello')
    expect(result.memories).toHaveLength(1)
    expect(result.memories[0].content).toBe('valid')
  })

  it('trims empty content memories', async () => {
    vi.mocked(ai.chat).mockResolvedValueOnce(
      '{"memories":[{"type":"event","content":"   ","confidence":"high"}],"people_mentioned":[],"topics":[],"emotions":[]}'
    )
    const result = await extractMemoriesFromConversation('hi', 'hello')
    expect(result.memories).toHaveLength(0)
  })
})
