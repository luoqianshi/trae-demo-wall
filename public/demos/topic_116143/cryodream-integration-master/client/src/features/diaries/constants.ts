// 情绪枚举
export const MOODS = [
  { value: 'joy', label: '喜悦', emoji: '😄', score: 2, color: 'text-amber-500' },
  { value: 'calm', label: '平静', emoji: '🙂', score: 0, color: 'text-green-500' },
  { value: 'anxious', label: '焦虑', emoji: '😰', score: -1, color: 'text-orange-500' },
  { value: 'sad', label: '低落', emoji: '😢', score: -2, color: 'text-blue-500' },
  { value: 'angry', label: '愤怒', emoji: '😠', score: -2, color: 'text-red-500' },
  { value: 'confused', label: '困惑', emoji: '🤔', score: -1, color: 'text-purple-500' },
] as const

export function getMoodInfo(mood?: string) {
  return MOODS.find((m) => m.value === mood) ?? MOODS[1]
}

// 分类颜色映射
export const CATEGORY_COLORS: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  pink: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  teal: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  gray: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300',
}

export function getCategoryColorClass(color?: string) {
  return CATEGORY_COLORS[color ?? 'gray'] ?? CATEGORY_COLORS.gray
}

// AI 分析状态
export const AI_STATUS = {
  pending: { label: '待分析', color: 'text-muted-foreground' },
  running: { label: '分析中', color: 'text-blue-500' },
  done: { label: '已分析', color: 'text-green-500' },
  failed: { label: '分析失败', color: 'text-red-500' },
} as const

export function getAiStatusInfo(status?: string) {
  return (AI_STATUS as Record<string, { label: string; color: string }>)[status ?? 'pending']
    ?? { label: '未知', color: 'text-muted-foreground' }
}
