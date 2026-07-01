import { describe, it, expect, vi, beforeEach } from 'vitest'
import { runReviewPipeline } from '../reviewPipeline'
import * as ai from '../ai'

vi.mock('../ai', () => ({ chat: vi.fn() }))
vi.mock('../rag', () => ({ retrieveContext: vi.fn().mockResolvedValue({ context: '', sources: [] }) }))
vi.mock('../db', () => ({ db: { agentTasks: { put: vi.fn() } } }))

describe('reviewPipeline structured output', () => {
  beforeEach(() => vi.clearAllMocks())

  it('parses structured plan and reviewer verdicts', async () => {
    const chat = vi.mocked(ai.chat)
    chat
      .mockResolvedValueOnce('{"plan":[{"agentId":"writer","task":"draft","parallel":false},{"agentId":"relation","task":"review","parallel":true}],"reasoning":"quick"}')
      .mockResolvedValueOnce('draft content')
      .mockResolvedValueOnce('{"verdict":"revise","comments":["add empathy"],"confidence":0.9,"reasoning":"missing empathy"}')
      .mockResolvedValueOnce('revised draft')
      .mockResolvedValueOnce('{"verdict":"pass","comments":[],"confidence":0.95,"reasoning":"good"}')
      .mockResolvedValueOnce('final draft')

    const result = await runReviewPipeline('我应该接受创业邀请吗')
    expect(result.finalDraft).toContain('final draft')
    expect(result.revisionCount).toBeGreaterThanOrEqual(0)
    expect(result.agentMetrics).toBeDefined()
    expect(Object.keys(result.agentMetrics!).sort()).toEqual(['host', 'orchestrator', 'relation', 'writer'])
  })

  it('falls back to keyword heuristic when review JSON is invalid', async () => {
    const chat = vi.mocked(ai.chat)
    chat
      .mockResolvedValueOnce('{"plan":[{"agentId":"writer","task":"draft","parallel":false},{"agentId":"relation","task":"review","parallel":true}],"reasoning":"quick"}')
      .mockResolvedValueOnce('draft content')
      .mockResolvedValueOnce('这个方案整体通过，没有明显问题')
      .mockResolvedValueOnce('final draft')

    const result = await runReviewPipeline('测试')
    expect(result.finalDraft).toContain('final draft')
  })

  it('records agent metrics for each call', async () => {
    const chat = vi.mocked(ai.chat)
    chat
      .mockResolvedValueOnce('{"plan":[{"agentId":"writer","task":"draft","parallel":false},{"agentId":"relation","task":"review","parallel":true}],"reasoning":"quick"}')
      .mockResolvedValueOnce('draft content')
      .mockResolvedValueOnce('{"verdict":"pass","comments":[],"confidence":0.95,"reasoning":"good"}')
      .mockResolvedValueOnce('final draft')

    const result = await runReviewPipeline('测试')
    const metrics = result.agentMetrics!
    expect(metrics.orchestrator.calls).toBe(1)
    expect(metrics.writer.calls).toBe(1)
    expect(metrics.relation.calls).toBe(1)
    expect(metrics.host.calls).toBe(1)
    expect(metrics.orchestrator.success).toBe(1)
  })
})
