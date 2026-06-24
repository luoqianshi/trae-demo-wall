export interface Task {
  id: string;
  name: string;
  description: string;
  category: string;
  duration: number;
  participants: number;
  icon: string;
  color: string;
  difficulty: '简单' | '中等' | '挑战';
  reward: number;
}

export const tasks: Task[] = [
  {
    id: 'task_1',
    name: '旧衣捐赠',
    description: '整理闲置衣物捐给需要的人，让旧衣重获新生，温暖更多人',
    category: '捐赠',
    duration: 30,
    participants: 1256,
    icon: '👕',
    color: 'bg-rose-100 text-rose-600',
    difficulty: '简单',
    reward: 30,
  },
  {
    id: 'task_2',
    name: '书籍漂流',
    description: '分享一本书给社区图书角，让知识在人与人之间流动',
    category: '捐赠',
    duration: 20,
    participants: 892,
    icon: '📚',
    color: 'bg-amber-100 text-amber-600',
    difficulty: '简单',
    reward: 20,
  },
  {
    id: 'task_3',
    name: '垃圾分类',
    description: '完成一次完整的垃圾分类，保护环境从你我做起',
    category: '环保',
    duration: 15,
    participants: 2341,
    icon: '♻️',
    color: 'bg-emerald-100 text-emerald-600',
    difficulty: '简单',
    reward: 15,
  },
  {
    id: 'task_4',
    name: '社区助老',
    description: '陪伴帮助社区老人，陪他们聊天、帮助购物、解决生活困难',
    category: '帮扶',
    duration: 60,
    participants: 567,
    icon: '👴',
    color: 'bg-violet-100 text-violet-600',
    difficulty: '中等',
    reward: 60,
  },
  {
    id: 'task_5',
    name: '公园环保清洁',
    description: '捡拾公共场所垃圾，还城市一片清洁美丽的天地',
    category: '环保',
    duration: 30,
    participants: 1823,
    icon: '🧹',
    color: 'bg-teal-100 text-teal-600',
    difficulty: '中等',
    reward: 30,
  },
  {
    id: 'task_6',
    name: '知识分享',
    description: '教别人一项技能或知识，可以是学习方法、工作技巧或生活经验',
    category: '传播',
    duration: 45,
    participants: 432,
    icon: '💡',
    color: 'bg-sky-100 text-sky-600',
    difficulty: '中等',
    reward: 45,
  },
  {
    id: 'task_7',
    name: '无偿献血宣传',
    description: '了解或宣传无偿献血知识，鼓励更多人参与生命的馈赠',
    category: '传播',
    duration: 30,
    participants: 678,
    icon: '❤️',
    color: 'bg-red-100 text-red-600',
    difficulty: '简单',
    reward: 30,
  },
  {
    id: 'task_8',
    name: '节水节电挑战',
    description: '完成一天节水/节电挑战，记录节约的水电用量，践行绿色生活',
    category: '环保',
    duration: 10,
    participants: 3456,
    icon: '💧',
    color: 'bg-blue-100 text-blue-600',
    difficulty: '简单',
    reward: 10,
  },
  {
    id: 'task_9',
    name: '关爱留守儿童',
    description: '给留守儿童写一封温暖的信，或通过公益机构寄送爱心包裹',
    category: '帮扶',
    duration: 45,
    participants: 389,
    icon: '🧒',
    color: 'bg-orange-100 text-orange-600',
    difficulty: '中等',
    reward: 45,
  },
  {
    id: 'task_10',
    name: '公益捐赠',
    description: '向公益项目捐赠任意金额，支持需要帮助的人，小额也是爱',
    category: '捐赠',
    duration: 5,
    participants: 5621,
    icon: '💰',
    color: 'bg-yellow-100 text-yellow-600',
    difficulty: '简单',
    reward: 10,
  },
  {
    id: 'task_11',
    name: '绿色出行日',
    description: '选择步行、骑行或公共交通出行，记录低碳出行的里程',
    category: '环保',
    duration: 25,
    participants: 2890,
    icon: '🚲',
    color: 'bg-green-100 text-green-600',
    difficulty: '简单',
    reward: 25,
  },
  {
    id: 'task_12',
    name: '社区文明宣传',
    description: '参与社区文明宣传活动，张贴海报或向居民讲解文明公约',
    category: '传播',
    duration: 40,
    participants: 756,
    icon: '📢',
    color: 'bg-indigo-100 text-indigo-600',
    difficulty: '中等',
    reward: 40,
  },
  {
    id: 'task_13',
    name: '关爱流浪动物',
    description: '投喂小区流浪猫狗，或为它们准备一个温暖的小窝',
    category: '帮扶',
    duration: 20,
    participants: 1567,
    icon: '🐱',
    color: 'bg-pink-100 text-pink-600',
    difficulty: '简单',
    reward: 20,
  },
  {
    id: 'task_14',
    name: '公益马拉松',
    description: '参与一次公益跑步活动，为公益项目筹集步数或善款',
    category: '传播',
    duration: 90,
    participants: 4234,
    icon: '🏃',
    color: 'bg-lime-100 text-lime-600',
    difficulty: '挑战',
    reward: 90,
  },
  {
    id: 'task_15',
    name: '志愿服务记录',
    description: '整理你的志愿服务经历，分享到社交媒体，鼓励更多人参与',
    category: '传播',
    duration: 30,
    participants: 834,
    icon: '📝',
    color: 'bg-cyan-100 text-cyan-600',
    difficulty: '简单',
    reward: 30,
  },
];

export const categories = ['全部', '环保', '捐赠', '帮扶', '传播'];

export const categoryColors: Record<string, { bg: string; text: string; border: string; light: string }> = {
  '环保': { bg: 'bg-emerald-500', text: 'text-emerald-600', border: 'border-emerald-200', light: 'bg-emerald-50' },
  '捐赠': { bg: 'bg-rose-500', text: 'text-rose-600', border: 'border-rose-200', light: 'bg-rose-50' },
  '帮扶': { bg: 'bg-violet-500', text: 'text-violet-600', border: 'border-violet-200', light: 'bg-violet-50' },
  '传播': { bg: 'bg-sky-500', text: 'text-sky-600', border: 'border-sky-200', light: 'bg-sky-50' },
};

export const levelNames = ['公益新手', '公益新星', '公益达人', '公益先锋', '公益领袖', '公益大师'];

export const getLevel = (totalMinutes: number): { level: number; name: string; progress: number; nextLevel: number } => {
  const thresholds = [0, 100, 300, 600, 1000, 1500];
  let level = 0;
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (totalMinutes >= thresholds[i]) {
      level = i;
      break;
    }
  }
  const currentThreshold = thresholds[level] || 0;
  const nextThreshold = thresholds[level + 1] || 1500;
  const denominator = (nextThreshold - currentThreshold) || 1;
  const progress = Math.min(100, Math.max(0, ((totalMinutes - currentThreshold) / denominator) * 100));
  return {
    level: level + 1,
    name: levelNames[level] || '公益大师',
    progress,
    nextLevel: nextThreshold,
  };
};
