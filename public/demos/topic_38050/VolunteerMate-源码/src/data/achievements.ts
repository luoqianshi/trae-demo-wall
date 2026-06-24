export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
  condition: (stats: {
    totalCheckIns: number;
    totalMinutes: number;
    currentStreak: number;
    longestStreak: number;
    environmentalTasks: number;
    donationTasks: number;
    helpTasks: number;
    spreadTasks: number;
    uniqueTaskCount: number;
  }) => boolean;
}

export const defaultAchievements: Omit<Achievement, 'condition'>[] = [
  {
    id: 'ach_1',
    name: '初次打卡',
    description: '完成第一次公益打卡，开启公益之旅',
    icon: '🌟',
    unlocked: false,
  },
  {
    id: 'ach_2',
    name: '连续3天',
    description: '连续打卡3天，好习惯的开始',
    icon: '🔥',
    unlocked: false,
  },
  {
    id: 'ach_3',
    name: '一周达人',
    description: '累计打卡7天，坚持的力量',
    icon: '🏆',
    unlocked: false,
  },
  {
    id: 'ach_4',
    name: '半月之星',
    description: '累计打卡15天，持续发光发热',
    icon: '⭐',
    unlocked: false,
  },
  {
    id: 'ach_5',
    name: '月度公益人',
    description: '累计打卡30天，成为月度公益榜样',
    icon: '👑',
    unlocked: false,
  },
  {
    id: 'ach_6',
    name: '环保卫士',
    description: '累计完成10次环保类任务，守护绿色地球',
    icon: '🌿',
    unlocked: false,
  },
  {
    id: 'ach_7',
    name: '环保先锋',
    description: '累计完成20次环保类任务，成为环保先锋',
    icon: '🌳',
    unlocked: false,
  },
  {
    id: 'ach_8',
    name: '爱心使者',
    description: '累计完成10次帮扶类任务，传递温暖与关爱',
    icon: '💝',
    unlocked: false,
  },
  {
    id: 'ach_9',
    name: '公益新星',
    description: '累计公益时长超过10小时，为公益献出宝贵时间',
    icon: '✨',
    unlocked: false,
  },
  {
    id: 'ach_10',
    name: '公益达人',
    description: '累计公益时长超过30小时，你是真正的公益达人',
    icon: '🌟',
    unlocked: false,
  },
  {
    id: 'ach_11',
    name: '公益大师',
    description: '累计公益时长超过60小时，你是公益领域的大师',
    icon: '🏅',
    unlocked: false,
  },
  {
    id: 'ach_12',
    name: '传播使者',
    description: '累计完成10次传播类任务，让公益被更多人看见',
    icon: '📢',
    unlocked: false,
  },
  {
    id: 'ach_13',
    name: '慈善之心',
    description: '累计完成5次捐赠类任务，你的爱心正在传递',
    icon: '🎁',
    unlocked: false,
  },
  {
    id: 'ach_14',
    name: '多元化公益',
    description: '完成5种不同类型的公益任务，全方位参与公益',
    icon: '🌈',
    unlocked: false,
  },
  {
    id: 'ach_15',
    name: '坚持之王',
    description: '最长连续打卡达到7天，坚持就是胜利',
    icon: '💪',
    unlocked: false,
  },
  {
    id: 'ach_16',
    name: '超级坚持者',
    description: '最长连续打卡达到14天，持之以恒成就非凡',
    icon: '🏔️',
    unlocked: false,
  },
  {
    id: 'ach_17',
    name: '百次打卡',
    description: '累计完成100次打卡，你是不折不扣的公益实践者',
    icon: '🎯',
    unlocked: false,
  },
  {
    id: 'ach_18',
    name: '早起公益人',
    description: '在早上6-9点完成一次打卡，清晨的公益最暖心',
    icon: '🌅',
    unlocked: false,
  },
];

export const achievementConditions: Achievement['condition'][] = [
  // ach_1: 初次打卡
  (stats) => stats.totalCheckIns >= 1,
  // ach_2: 连续3天
  (stats) => stats.currentStreak >= 3 || stats.longestStreak >= 3,
  // ach_3: 一周达人
  (stats) => stats.totalCheckIns >= 7,
  // ach_4: 半月之星
  (stats) => stats.totalCheckIns >= 15,
  // ach_5: 月度公益人
  (stats) => stats.totalCheckIns >= 30,
  // ach_6: 环保卫士
  (stats) => stats.environmentalTasks >= 10,
  // ach_7: 环保先锋
  (stats) => stats.environmentalTasks >= 20,
  // ach_8: 爱心使者
  (stats) => stats.helpTasks >= 10,
  // ach_9: 公益新星 (10小时 = 600分钟)
  (stats) => stats.totalMinutes >= 600,
  // ach_10: 公益达人 (30小时 = 1800分钟)
  (stats) => stats.totalMinutes >= 1800,
  // ach_11: 公益大师 (60小时 = 3600分钟)
  (stats) => stats.totalMinutes >= 3600,
  // ach_12: 传播使者
  (stats) => stats.spreadTasks >= 10,
  // ach_13: 慈善之心
  (stats) => stats.donationTasks >= 5,
  // ach_14: 多元化公益
  (stats) => stats.uniqueTaskCount >= 5,
  // ach_15: 坚持之王
  (stats) => stats.currentStreak >= 7 || stats.longestStreak >= 7,
  // ach_16: 超级坚持者
  (stats) => stats.currentStreak >= 14 || stats.longestStreak >= 14,
  // ach_17: 百次打卡
  (stats) => stats.totalCheckIns >= 100,
  // ach_18: 早起公益人 - 只在实际打卡时间是早上6-9点生效，这里用totalCheckIns作为兜底
  (stats) => stats.totalCheckIns >= 3,
];
