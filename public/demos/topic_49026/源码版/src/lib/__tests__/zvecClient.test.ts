import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { zvecClient } from '../zvecClient'

describe('zvecClient', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('indexes an item', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }))

    await zvecClient.index({
      sourceType: 'memory',
      sourceId: 'm1',
      text: 'hello',
      embedding: [1, 0, 0, 0],
      createdAt: 1,
    })

    expect(fetch).toHaveBeenCalledWith(
      '/api/vector/index',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"sourceType":"memory"'),
      })
    )
  })

  it('returns search results', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ results: [{ sourceType: 'memory', sourceId: 'm1', text: 'hello', createdAt: 1, similarity: 0.9 }] }), { status: 200 })
    )

    const results = await zvecClient.search({ queryEmbedding: [1, 0, 0, 0], limit: 5 })
    expect(results).toHaveLength(1)
    expect(results[0].sourceId).toBe('m1')
  })

  it('throws on non-ok response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response('boom', { status: 500 }))

    await expect(zvecClient.count()).rejects.toThrow('Zvec vector API /count failed: 500')
  })
})
