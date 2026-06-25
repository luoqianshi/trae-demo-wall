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
import { getLevel } from '../data/tasks';

export interface Insight {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: 'stats' | 'pattern' | 'recommendation' | 'milestone';
  value?: string;
  trend?: 'up' | 'down' | 'flat';
}

export interface AIProfile {
  persona: string;
  description: string;
  color: string;
  traits: string[];
}

const PERSONA_POOL: AIProfile[] = [
  {
    persona: '环保先锋',
    description: '你对地球充满关怀，在环保领域投入最多时间。绿色出行、垃圾分类、低碳生活都是你的日常。',
    color: 'from-emerald-400 to-teal-500',
    traits: ['🌿 自然守护者', '♻️ 循环生活者', '🌍 地球公民'],
  },
  {
    persona: '温暖传递者',
    description: '你擅长通过分享和捐赠创造价值，相信每一个闲置物品都能温暖另一个人。',
    color: 'from-rose-400 to-pink-500',
    traits: ['🎁 慷慨分享', '💫 价值传递者', '❤️ 温暖行动派'],
  },
  {
    persona: '社区桥梁',
    description: '你关注身边的人——老人、孩子、邻居，用陪伴和行动让社区变得更温暖。',
    color: 'from-violet-400 to-fuchsia-500',
    traits: ['🏘️ 社区建设者', '🤝 邻里纽带', '👋 关怀他人'],
  },
  {
    persona: '公益传播者',
    description: '你相信看见的力量，通过分享和传播让更多人加入公益。影响力就是你的超能力。',
    color: 'from-sky-400 to-blue-500',
    traits: ['📢 大声说爱', '✨ 感染力强', '📣 公益代言人'],
  },
  {
    persona: '全能公益人',
    description: '你在各个公益领域均衡发展，是真正的 "公益随手做" 践行者——无论什么都愿意尝试。',
    color: 'from-amber-400 to-orange-500',
    traits: ['🌟 多元行动者', '🚀 全面探索', '💪 持续践行'],
  },
];

const getPersona = (stats: UserStats): AIProfile => {
  const env = stats.environmentalTasks;
  const don = stats.donationTasks;
  const help = stats.helpTasks;
  const spr = stats.spreadTasks;
  const total = env + don + help + spr;
  if (total === 0) return PERSONA_POOL[4]; // 默认全能

  const max = Math.max(env, don, help, spr);
  if (max / total > 0.45) {
    if (env === max) return PERSONA_POOL[0];
    if (don === max) return PERSONA_POOL[1];
    if (help === max) return PERSONA_POOL[2];
    return PERSONA_POOL[3];
  }
  return PERSONA_POOL[4];
};

export const generateInsights = (stats: UserStats, records: CheckInRecord[]): Insight[] => {
  const levelInfo = getLevel(stats.totalMinutes);
  const insights: Insight[] = [];
  const persona = getPersona(stats);

  insights.push({
    id: 'persona',
    title: `你的公益画像：${persona.persona}`,
    description: persona.description,
    icon: '🎭',
    type: 'pattern',
  });

  insights.push({
    id: 'level',
    title: `当前等级：Lv.${levelInfo.level} ${levelInfo.name}`,
    description: `距离「${levelInfo.level < 6 ? getLevel(levelInfo.nextLevel).name : '最高等级'}」还需 ${Math.max(0, levelInfo.nextLevel - stats.totalMinutes)} 分钟`,
    icon: '🏆',
    type: 'milestone',
    value: `${levelInfo.progress.toFixed(0)}%`,
  });

  if (stats.currentStreak >= 3) {
    insights.push({
      id: 'streak',
      title: `连续 ${stats.currentStreak} 天在行动`,
      description: stats.currentStreak >= 7
        ? '一周坚持！你已经把公益变成了生活习惯。'
        : '坚持就是胜利，继续保持这个节奏。',
      icon: '🔥',
      type: 'milestone',
      trend: 'up',
    });
  }

  if (stats.totalCheckIns > 0) {
    const avg = stats.totalMinutes / stats.totalCheckIns;
    insights.push({
      id: 'avg',
      title: '平均每次投入',
      description: `你完成 ${stats.totalCheckIns} 次打卡，平均每次投入 ${avg.toFixed(0)} 分钟。${avg > 30 ? '深度参与者！' : avg > 20 ? '稳定行动派！' : '碎片时间利用得很好！'}`,
      icon: '⏱️',
      type: 'stats',
      value: `${avg.toFixed(0)} 分钟`,
    });
  }

  const days = new Set(
    records.map((r) => new Date(r.timestamp).toDateString())
  ).size;
  if (days > 0) {
    insights.push({
      id: 'days',
      title: `在 ${days} 个不同的日子行动过`,
      description: '公益不是一次的冲动，而是持续的选择。',
      icon: '📅',
      type: 'pattern',
      value: `${days} 天`,
    });
  }

  // Category balance
  const catTotal = stats.environmentalTasks + stats.donationTasks + stats.helpTasks + stats.spreadTasks;
  if (catTotal > 0) {
    const max = Math.max(stats.environmentalTasks, stats.donationTasks, stats.helpTasks, stats.spreadTasks);
    const balance = (max / catTotal) * 100;
    if (balance > 70) {
      insights.push({
        id: 'diversity',
        title: '可以尝试更多样的公益方式',
        description: '你的公益行动有明显的领域偏好。下次可以试试不同类型的任务，会有新的收获。',
        icon: '🎯',
        type: 'recommendation',
      });
    } else if (balance < 35) {
      insights.push({
        id: 'balance',
        title: '公益领域均衡发展',
        description: '你在各类型的公益任务间平衡探索，这是真正的全能公益人成长轨迹。',
        icon: '⚖️',
        type: 'pattern',
      });
    }
  }

  // Early bird check
  const recentEarly = records.filter((r) => {
    const h = new Date(r.timestamp).getHours();
    return h >= 6 && h < 9;
  }).length;
  if (recentEarly >= 3) {
    insights.push({
      id: 'early',
      title: '你是早起公益达人 🌅',
      description: `最近有 ${recentEarly} 次在清晨完成打卡。一日之计在于晨，你的一天从善意开始。`,
      icon: '🌅',
      type: 'pattern',
      trend: 'up',
    });
  }

  if (insights.length < 4) {
    insights.push({
      id: 'encourage',
      title: '旅程才刚刚开始',
      description: '每一次打卡都是新的起点。下一次尝试一个你没做过的类型，会发现新的自己。',
      icon: '🚀',
      type: 'recommendation',
    });
  }

  return insights;
};

export const getMotivationalMessage = (stats: UserStats, lastCheckInHours: number): { message: string; emoji: string } => {
  if (stats.totalCheckIns === 0) {
    return {
      message: '欢迎来到 VolunteerMate！从一个 15 分钟的任务开始你的第一次公益吧 ✨',
      emoji: '🎈',
    };
  }
  if (stats.currentStreak >= 7) {
    return {
      message: `连续 ${stats.currentStreak} 天在行动！你已经把公益变成了习惯，真的了不起 🔥`,
      emoji: '🔥',
    };
  }
  if (stats.currentStreak >= 3) {
    return {
      message: `连续 ${stats.currentStreak} 天坚持，你正在创造自己的节奏。今天继续吗？`,
      emoji: '💪',
    };
  }
  if (lastCheckInHours > 48) {
    return {
      message: '两天没见啦，世界还在等你的一份善意 🌱',
      emoji: '🌱',
    };
  }
  const messages = [
    `累计 ${stats.totalMinutes} 分钟公益时间，每一分钟都是温柔的力量 ✨`,
    `已完成 ${stats.totalCheckIns} 次打卡，你比自己想象的做得更多 🌟`,
    `今天的一点点善意，会在某个地方发芽 🌿`,
    `保持这个节奏，你就是自己最想成为的那种人 💫`,
  ];
  return {
    message: messages[stats.totalCheckIns % messages.length],
    emoji: '✨',
  };
};

export const getUserPersona = getPersona;
