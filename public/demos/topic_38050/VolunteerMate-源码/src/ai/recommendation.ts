import { tasks, Task, getLevel } from '../data/tasks';
import { UserStats } from '../store/useStore';

type CheckInRecord = {
  id: string;
  taskId: string;
  taskName: string;
  taskIcon: string;
  duration: number;
  timestamp: number;
  category: string;
  difficulty: string;
};

export interface AITaskScore {
  task: Task;
  score: number;
  reason: string;
  tags: string[];
}

const TIME_SLOT_TAGS: Record<string, string[]> = {
  morning: ['早起打卡', '绿色出行', '轻量任务', '5分钟开始'],
  afternoon: ['社区活动', '户外清洁', '知识分享', '中等任务'],
  evening: ['公益捐赠', '志愿服务', '深度参与', '睡前学习'],
  night: ['整理记录', '学习知识', '简单任务', '轻松完成'],
};

const CATEGORY_TAG_MAP: Record<string, string[]> = {
  '环保': ['热爱自然', '可持续生活', '绿色达人', '地球守护者'],
  '捐赠': ['分享精神', '物尽其用', '温暖传递', '爱心捐赠者'],
  '帮扶': ['关怀他人', '社区纽带', '共情力强', '温暖陪伴者'],
  '传播': ['影响力', '号召力', '传播者', '公益放大器'],
};

const getTimeSlot = (): keyof typeof TIME_SLOT_TAGS => {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
};

const getCategoryPreference = (stats: UserStats): Record<string, number> => {
  const total = stats.environmentalTasks + stats.donationTasks + stats.helpTasks + stats.spreadTasks + 1;
  return {
    '环保': (stats.environmentalTasks / total) * 100 + 15,
    '捐赠': (stats.donationTasks / total) * 100 + 15,
    '帮扶': (stats.helpTasks / total) * 100 + 15,
    '传播': (stats.spreadTasks / total) * 100 + 15,
  };
};

const getCompletedTaskIds = (records: CheckInRecord[]): Set<string> => {
  return new Set(records.slice(-30).map((r) => r.taskId));
};

const hasTaskBeenCompletedRecently = (taskId: string, records: CheckInRecord[], days: number): boolean => {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return records.some((r) => r.taskId === taskId && r.timestamp > cutoff);
};

export const getAITaskRecommendations = (
  stats: UserStats,
  checkInRecords: CheckInRecord[],
  count: number = 4
): AITaskScore[] => {
  const timeSlot = getTimeSlot();
  const timeTags = TIME_SLOT_TAGS[timeSlot];
  const preferences = getCategoryPreference(stats);
  const recentCompletedIds = getCompletedTaskIds(checkInRecords);
  const levelInfo = getLevel(stats.totalMinutes);

  const scored: AITaskScore[] = tasks.map((task) => {
    let score = 0;
    const reasons: string[] = [];
    const tags: string[] = [];

    // Category preference boost
    score += preferences[task.category] || 0;
    if (preferences[task.category] && preferences[task.category] > 25) {
      reasons.push(`你${task.category}类任务参与度最高`);
    }
    CATEGORY_TAG_MAP[task.category]?.forEach((t) => tags.push(t));

    // Time slot relevance
    if (task.duration <= 15 && (timeSlot === 'morning' || timeSlot === 'night')) {
      score += 15;
      reasons.push('这个时间段适合快速完成');
    }
    if (task.duration >= 45 && timeSlot === 'afternoon') {
      score += 15;
      reasons.push('下午有充足时间深入参与');
    }
    timeTags.forEach((t) => tags.push(t));

    // Variety: penalize recently completed
    if (hasTaskBeenCompletedRecently(task.id, checkInRecords, 3)) {
      score -= 25;
      reasons.push('尝试些新任务扩展公益面');
    } else {
      score += 10;
    }

    // Difficulty matching to level
    if (levelInfo.level >= 4 && task.difficulty === '挑战') {
      score += 15;
      reasons.push('高级用户适合挑战任务');
    }
    if (levelInfo.level <= 2 && task.difficulty === '简单') {
      score += 10;
      reasons.push('新手友好，轻松入门');
    }

    // Popularity factor (small boost for community-active tasks)
    if (task.participants > 1500) {
      score += 5;
      reasons.push('最受欢迎的公益任务之一');
    }

    // New task exploration boost
    if (!recentCompletedIds.has(task.id)) {
      score += 8;
    }

    // Strip duplicate reasons
    const uniqueReasons = Array.from(new Set(reasons)).slice(0, 2);
    const finalReason = uniqueReasons.join('，') || 'AI 认为这个任务适合你';

    return {
      task,
      score,
      reason: finalReason,
      tags: Array.from(new Set(tags)).slice(0, 3),
    };
  });

  // Sort by score
  scored.sort((a, b) => b.score - a.score);

  // Ensure variety: if top items share category, mix it up
  const result: AITaskScore[] = [];
  const usedCategories = new Set<string>();
  for (const item of scored) {
    if (usedCategories.has(item.task.category) && result.length < count - 1) {
      // Allow at most 1 from each category in top positions
      continue;
    }
    result.push(item);
    usedCategories.add(item.task.category);
    if (result.length >= count) break;
  }
  // Fill remaining
  if (result.length < count) {
    for (const item of scored) {
      if (!result.includes(item)) {
        result.push(item);
        if (result.length >= count) break;
      }
    }
  }

  return result;
};

export const getDailyTheme = (): { title: string; subtitle: string; emoji: string; color: string } => {
  const dayOfWeek = new Date().getDay();
  const themes = [
    { title: '周日社区日', subtitle: '走近邻里，做一件温暖社区的小事', emoji: '🏘️', color: 'from-violet-500 to-fuchsia-500' },
    { title: '周一绿色日', subtitle: '低碳出行，垃圾分类，从一周之始开始', emoji: '🌱', color: 'from-emerald-500 to-teal-500' },
    { title: '周二知识日', subtitle: '读一篇公益好文，让认知成为行动力量', emoji: '📖', color: 'from-sky-500 to-blue-500' },
    { title: '周三关爱日', subtitle: '关注身边的老人、孩子与动物', emoji: '💝', color: 'from-rose-500 to-pink-500' },
    { title: '周四传播日', subtitle: '让公益被看见，你的一次转发就是力量', emoji: '📣', color: 'from-amber-500 to-orange-500' },
    { title: '周五分享日', subtitle: '分享闲置物品，让价值重新流动', emoji: '🎁', color: 'from-yellow-500 to-amber-500' },
    { title: '周六行动日', subtitle: '周末走出家门，参与一场线下公益', emoji: '🌟', color: 'from-cyan-500 to-sky-500' },
  ];
  return themes[dayOfWeek];
};
