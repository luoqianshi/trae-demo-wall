import { describe, it, expect, vi, beforeEach } from 'vitest'
import { processUserMessage } from '../chatPipeline'
import * as rag from '../rag'
import * as ai from '../ai'

vi.mock('../rag')
vi.mock('../ai')
vi.mock('../memoryExtractor', () => ({
  extractMemoriesFromConversation: vi.fn().mockResolvedValue({ memories: [] }),
  saveExtractedMemories: vi.fn().mockResolvedValue([]),
}))
vi.mock('../pluginEngine', () => ({
  pluginEngine: {
    beforeChat: vi.fn().mockResolvedValue({}),
    afterMemoryExtract: vi.fn().mockResolvedValue([]),
  },
}))
vi.mock('../queryCache', () => ({
  findCachedQuery: vi.fn().mockResolvedValue({ entry: null, method: 'miss', similarity: 0 }),
  cacheQuery: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('../analytics', () => ({
  track: { action: vi.fn(), perf: vi.fn(), llm: vi.fn(), error: vi.fn() },
}))

describe('chatPipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns cached response when cache hit', async () => {
    const { findCachedQuery } = await import('../queryCache')
    vi.mocked(findCachedQuery).mockResolvedValueOnce({
      entry: {
        query: 'hi',
        queryEmbedding: null,
        ragResult: {
          memories: [],
          people: [],
          diaries: [],
          context: '',
          method: 'keyword',
          tiers: { hot: 0, warm: 0, cold: 0 },
          sources: [],
        },
        llmResponse: 'cached answer',
        timestamp: Date.now(),
        hitCount: 0,
        method: 'semantic',
      },
      method: 'semantic',
      similarity: 0.95,
    })

    const res = await processUserMessage({ userContent: 'hi', messages: [], onStream: vi.fn() })
    expect(res.response).toBe('cached answer')
    expect(res.model).toContain('cached')
  })

  it('streams response and returns retrieval metadata', async () => {
    vi.mocked(rag.retrieveContext).mockResolvedValueOnce({
      memories: [],
      people: [],
      diaries: [],
      context: '',
      method: 'semantic',
      tiers: { hot: 0, warm: 0, cold: 0 },
      sources: [],
    } as any)
    vi.mocked(ai.safeStreamChat).mockResolvedValueOnce({
      stream: (async function* () {
        yield 'hello'
        yield ' world'
      })(),
      model: 'deepseek-v4-pro',
      mode: 'live',
    } as any)

    const onStream = vi.fn()
    const res = await processUserMessage({ userContent: 'hi', messages: [], onStream })
    expect(res.response).toBe('hello world')
    expect(res.model).toBe('deepseek-v4-pro')
    expect(res.mode).toBe('live')
    expect(onStream).toHaveBeenCalledWith('hello')
  })

  it('returns demo reply when backend has no key', async () => {
    vi.mocked(rag.retrieveContext).mockResolvedValueOnce({
      memories: [],
      people: [],
      diaries: [],
      context: '',
      method: 'semantic',
      tiers: { hot: 0, warm: 0, cold: 0 },
      sources: [],
    } as any)
    vi.mocked(ai.safeStreamChat).mockResolvedValueOnce({
      stream: (async function* () {
        yield '【示例回复】'
        yield '听起来你现在压力很大。'
      })(),
      model: 'demo-local',
      mode: 'demo',
      demoText: '【示例回复】听起来你现在压力很大。',
    } as any)

    const onStream = vi.fn()
    const result = await processUserMessage({
      userContent: '王思亮周会上又当众质疑我',
      messages: [],
      onStream,
    })

    expect(result.response).toContain('示例回复')
    expect(result.mode).toBe('demo')
    expect(onStream).toHaveBeenCalled()
  })
})
