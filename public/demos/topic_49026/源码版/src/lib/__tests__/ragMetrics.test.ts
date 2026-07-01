import { describe, it, expect, vi } from 'vitest'
import { evaluateRag, formatRagReport } from '../ragMetrics'
import * as rag from '../rag'

vi.mock('../rag', () => ({ retrieveContext: vi.fn() }))

describe('ragMetrics', () => {
  it('computes recall and mrr', async () => {
    vi.mocked(rag.retrieveContext).mockResolvedValueOnce({
      memories: [{ id: 'm1' }, { id: 'm2' }, { id: 'm3' }],
    } as any)
    const result = await evaluateRag('query', ['m2', 'm3'], 3)
    expect(result.recallAtK).toBe(1)
    // m2 is at rank 1 (second position), so reciprocal rank is 1/2
    expect(result.mrr).toBe(0.5)
  })

  it('gives mrr 1 when the first expected item is ranked first', async () => {
    vi.mocked(rag.retrieveContext).mockResolvedValueOnce({
      memories: [{ id: 'm2' }, { id: 'm1' }, { id: 'm3' }],
    } as any)
    const result = await evaluateRag('query', ['m2', 'm3'], 3)
    expect(result.recallAtK).toBe(1)
    expect(result.mrr).toBe(1)
  })

  it('formats report', () => {
    const report = formatRagReport([
      { query: 'q', recallAtK: 0.5, mrr: 0.5, latencyMs: 100, retrievedIds: [], expectedIds: ['m1', 'm2'] },
      { query: 'q2', recallAtK: 1, mrr: 1, latencyMs: 200, retrievedIds: [], expectedIds: ['m1', 'm2'] },
    ])
    expect(report).toContain('查询数=2')
    expect(report).toContain('平均Recall@2=0.75')
  })
})
