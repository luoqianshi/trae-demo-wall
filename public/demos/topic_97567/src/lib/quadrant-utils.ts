export interface Thresholds {
  critical: number;
  high: number;
  medium: number;
  low: number;
  none: number;
}

export const DEFAULT_THRESHOLDS: Thresholds = {
  critical: 1,
  high: 3,
  medium: 7,
  low: 14,
  none: 30,
};

export type UrgencyLevel = 'critical' | 'high' | 'medium' | 'low' | 'none';
export type QuadrantType = 1 | 2 | 3 | 4;

// 修复 H-3: 纯日期串(YYYY-MM-DD)按 UTC 00:00 解析会导致非 UTC 时区错位一天
// 将纯日期串补全为本地时间，避免时区偏移
function parseDueDate(dueDate: string): Date {
  // 纯日期串 YYYY-MM-DD 或 YYYY/MM/DD
  if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(dueDate)) {
    return new Date(`${dueDate.replace(/\//g, '-')}T00:00:00`);
  }
  return new Date(dueDate);
}

export function calculateUrgency(
  dueDate: string | undefined | null,
  thresholds: Thresholds = DEFAULT_THRESHOLDS
): UrgencyLevel | undefined {
  if (!dueDate) return undefined;

  const daysUntilDue = Math.ceil(
    (parseDueDate(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  if (daysUntilDue <= thresholds.critical) return 'critical';
  if (daysUntilDue <= thresholds.high) return 'high';
  if (daysUntilDue <= thresholds.medium) return 'medium';
  if (daysUntilDue <= thresholds.low) return 'low';
  return 'none';
}

export function calculateQuadrant(
  importance: number | undefined | null,
  urgency: UrgencyLevel | undefined | null
): QuadrantType | undefined {
  if (!importance || !urgency) return undefined;

  const isImportant = importance >= 4;

  const urgencyLevel: Record<UrgencyLevel, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
    none: 0,
  };

  const isUrgent = (urgencyLevel[urgency] ?? 0) >= 3;

  if (isImportant && isUrgent) return 1;
  if (isImportant && !isUrgent) return 2;
  if (!isImportant && isUrgent) return 3;
  return 4;
}

export function calculateBigTaskProgress(subtasks: { status: string }[]): number {
  if (subtasks.length === 0) return 0;
  const completed = subtasks.filter(t => t.status === 'completed').length;
  return Math.round((completed / subtasks.length) * 100);
}

export const URGENCY_CONFIG: Record<UrgencyLevel, { icon: string; label: string; color: string }> = {
  critical: { icon: '🔥', label: '极高', color: 'text-red-600' },
  high: { icon: '⚡', label: '高', color: 'text-red-500' },
  medium: { icon: '📅', label: '中', color: 'text-orange-500' },
  low: { icon: '⏰', label: '低', color: 'text-yellow-500' },
  none: { icon: '🗓️', label: '无', color: 'text-gray-400' },
};

export const QUADRANT_CONFIG: Record<QuadrantType, { icon: string; label: string; bgColor: string; borderColor: string }> = {
  1: { icon: '🔥', label: '立即做', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
  2: { icon: '📅', label: '计划做', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  3: { icon: '📋', label: '委托', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
  4: { icon: '🗑️', label: '删除', bgColor: 'bg-gray-100', borderColor: 'border-gray-200' },
};

export function getUrgencyDisplay(urgency: UrgencyLevel | undefined | null): { icon: string; label: string; color: string } {
  if (!urgency) return { icon: '', label: '', color: '' };
  return URGENCY_CONFIG[urgency];
}

export function getImportanceStars(importance: number | undefined | null): string {
  if (!importance) return '';
  return '⭐'.repeat(importance);
}

export function getDaysUntilDue(dueDate: string | undefined | null): number | undefined {
  if (!dueDate) return undefined;
  const days = Math.ceil(
    (parseDueDate(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  // 修复 H-3 引入的回归: Math.ceil 对 (-1, 0] 区间返回 -0，标准化为 +0
  return days === 0 ? 0 : days;
}

export function getDueDateLabel(dueDate: string | undefined | null): string {
  if (!dueDate) return '';
  const days = getDaysUntilDue(dueDate);
  if (days === undefined) return '';
  if (days <= 0) return '已过期';
  if (days === 1) return '今天';
  if (days === 2) return '明天';
  if (days <= 7) return `${days}天后`;
  if (days <= 30) return `${Math.ceil(days / 7)}周后`;
  return `${Math.ceil(days / 30)}月后`;
}
