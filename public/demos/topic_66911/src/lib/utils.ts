export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function calculateProgress(current: number, total: number): number {
  if (total === 0) return 0
  return Math.min(Math.round((current / total) * 100), 100)
}

export function getDaysRemaining(deadline: string): number {
  const today = new Date()
  const end = new Date(deadline)
  const diff = end.getTime() - today.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function getRiskLevel(progress: number, daysRemaining: number, totalDays: number): 'low' | 'medium' | 'high' {
  const expectedProgress = ((totalDays - daysRemaining) / totalDays) * 100
  const gap = expectedProgress - progress
  
  if (gap > 20) return 'high'
  if (gap > 10) return 'medium'
  return 'low'
}
