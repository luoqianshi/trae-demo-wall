export interface Task {
  status: string;
  type?: string;
  parent_id?: string;
  completed_at?: string;
}

export interface Record {
  created_at: string;
}

export interface TaskScoreBreakdown {
  normalCompleted: number;
  quickCompleted: number;
  subtaskCompleted: number;
  habitCheckins: number;
  bigTaskCompleted: number;
}

function toLocalDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function toLocalDateStrFromISO(isoStr: string): string {
  const d = new Date(isoStr);
  return toLocalDateStr(d);
}

export function calculateTaskScore(tasks: Task[]): TaskScoreBreakdown {
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const normalCompleted = completedTasks.filter(t =>
    (!t.type || (t.type !== 'big' && t.type !== 'quick' && t.type !== 'habit')) && !t.parent_id
  ).length;
  // 修复 H-2: quick 任务按设计应为顶层独立任务，避免与 subtask 双重计数
  const quickCompleted = completedTasks.filter(t => t.type === 'quick' && !t.parent_id).length;
  // subtask 仅统计非 quick 类型（quick 不应作为子任务）
  const subtaskCompleted = completedTasks.filter(t => t.parent_id && t.type !== 'quick').length;
  const habitCheckins = completedTasks.filter(t => t.type === 'habit').length;
  const bigTaskCompleted = completedTasks.filter(t => t.type === 'big').length;

  return {
    normalCompleted,
    quickCompleted,
    subtaskCompleted,
    habitCheckins,
    bigTaskCompleted,
  };
}

export function calculateStreakDays(records: { created_at: string }[]): number {
  const sortedDates = [...new Set(
    records.map(r => toLocalDateStrFromISO(r.created_at))
  )].sort().reverse();

  if (sortedDates.length === 0) return 0;

  const today = new Date();
  const todayStr = toLocalDateStr(today);

  const hasTodayRecord = sortedDates.includes(todayStr);

  let streakDays = 0;
  const checkDate = new Date(today);
  checkDate.setHours(0, 0, 0, 0);

  if (!hasTodayRecord) {
    const yesterday = new Date(checkDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = toLocalDateStr(yesterday);
    if (!sortedDates.includes(yesterdayStr)) {
      return 0;
    }
    checkDate.setDate(checkDate.getDate() - 1);
  }

  for (let i = 0; i < 365; i++) {
    const dateStr = toLocalDateStr(checkDate);
    if (sortedDates.includes(dateStr)) {
      streakDays++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streakDays;
}

export function calculateTodayScore(
  records: Record[],
  tasks: Task[]
): { todayScore: number; todayRecords: number; todayCompletedTasks: number } {
  const todayStr = toLocalDateStr(new Date());

  const todayRecords = records.filter(r =>
    r.created_at && toLocalDateStrFromISO(r.created_at) === todayStr
  ).length;

  const todayCompletedTasks = tasks.filter(t =>
    t.status === 'completed' && t.completed_at && toLocalDateStrFromISO(t.completed_at) === todayStr
  );

  return {
    todayScore: 0,
    todayRecords,
    todayCompletedTasks: todayCompletedTasks.length,
  };
}

export function calculateTotalStats(
  records: Record[],
  tasks: Task[],
) {
  const taskBreakdown = calculateTaskScore(tasks);
  const todayData = calculateTodayScore(records, tasks);
  const todayStreak = calculateStreakDays(records);

  return {
    totalScore: 0,
    todayScore: todayData.todayScore,
    todayStreak,
    recordCount: records.length,
    taskCompletedCount: taskBreakdown.normalCompleted +
                        taskBreakdown.quickCompleted +
                        taskBreakdown.subtaskCompleted +
                        taskBreakdown.habitCheckins +
                        taskBreakdown.bigTaskCompleted,
  };
}
