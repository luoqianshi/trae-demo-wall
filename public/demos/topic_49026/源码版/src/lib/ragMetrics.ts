import { retrieveContext } from './rag'

export interface RagMetrics {
  query: string
  recallAtK: number
  mrr: number
  latencyMs: number
  retrievedIds: string[]
  expectedIds: string[]
}

export async function evaluateRag(query: string, expectedIds: string[], k = 10): Promise<RagMetrics> {
  const start = performance.now()
  const result = await retrieveContext(query)
  const latencyMs = Math.round(performance.now() - start)

  const retrievedIds = result.memories.slice(0, k).map((m) => m.id)
  const hits = expectedIds.filter((id) => retrievedIds.includes(id))
  const recallAtK = expectedIds.length > 0 ? hits.length / expectedIds.length : 0

  let mrr = 0
  for (const id of expectedIds) {
    const rank = retrievedIds.indexOf(id)
    if (rank >= 0) mrr = Math.max(mrr, 1 / (rank + 1))
  }

  return { query, recallAtK, mrr, latencyMs, retrievedIds, expectedIds }
}

export function formatRagReport(metrics: RagMetrics[]): string {
  if (metrics.length === 0) return 'RAG评估：无数据'
  const avgRecall = metrics.reduce((s, m) => s + m.recallAtK, 0) / metrics.length
  const avgMrr = metrics.reduce((s, m) => s + m.mrr, 0) / metrics.length
  const avgLatency = metrics.reduce((s, m) => s + m.latencyMs, 0) / metrics.length
  const k = metrics[0].expectedIds.length
  return `RAG评估: 查询数=${metrics.length}, 平均Recall@${k}=${avgRecall.toFixed(2)}, MRR=${avgMrr.toFixed(2)}, 平均延迟=${avgLatency.toFixed(0)}ms`
}
