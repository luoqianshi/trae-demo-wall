import { useMemo } from 'react'

interface DailyRecord {
  date: string
  baseline: number
  latest: number
}

function todayKey(novelId: string) {
  const d = new Date()
  const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return { storageKey: `novel:daily:${novelId}`, dateStr }
}

/**
 * 记录本部小说的"今日写作字数"
 * 每天首次调用时把当前 wordCount 作为基线；后续 latest - baseline = 今日新增
 *
 * 通过 useMemo 在渲染期计算并持久化到 localStorage（副作用是幂等 / 无外部订阅），
 * 避免 React 19 的 setState-in-effect 告警。
 */
export function useDailyProgress(novelId: string, wordCount: number): number {
  return useMemo(() => {
    if (typeof window === 'undefined') return 0
    const { storageKey, dateStr } = todayKey(novelId)
    let record: DailyRecord | null = null
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) record = JSON.parse(raw) as DailyRecord
    } catch {
      record = null
    }
    if (!record || record.date !== dateStr) {
      const fresh: DailyRecord = { date: dateStr, baseline: wordCount, latest: wordCount }
      localStorage.setItem(storageKey, JSON.stringify(fresh))
      return 0
    }
    if (wordCount < record.baseline) {
      record.baseline = wordCount
    }
    record.latest = wordCount
    localStorage.setItem(storageKey, JSON.stringify(record))
    return Math.max(0, record.latest - record.baseline)
  }, [novelId, wordCount])
}
