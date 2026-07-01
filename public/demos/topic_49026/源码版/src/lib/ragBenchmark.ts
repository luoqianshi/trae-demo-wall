export const ragBenchmarkCases = [
  { query: '妈妈的生日是什么时候', expectedIds: ['mem-mom-birthday'] },
  { query: '周末陪儿子买什么', expectedIds: ['mem-son-lego'] },
]

export async function runRagBenchmark(
  evaluate: (q: string, ids: string[]) => Promise<{ recallAtK: number; mrr: number; latencyMs: number }>
) {
  const results = []
  for (const c of ragBenchmarkCases) {
    results.push(await evaluate(c.query, c.expectedIds))
  }
  return results
}
