export interface LeaderboardUser {
  id: string;
  name: string;
  avatar: string;
  totalMinutes: number;
  totalCheckIns: number;
  streak: number;
  level: number;
  levelName: string;
  badges: string[];
  isCurrentUser?: boolean;
}

export const leaderboardData: LeaderboardUser[] = [
  {
    id: 'user_1',
    name: '公益达人小李',
    avatar: '🌟',
    totalMinutes: 1560,
    totalCheckIns: 89,
    streak: 32,
    level: 6,
    levelName: '公益大师',
    badges: ['🔥', '🏆', '👑', '🌳'],
  },
  {
    id: 'user_2',
    name: '环保先锋张张',
    avatar: '🌿',
    totalMinutes: 980,
    totalCheckIns: 56,
    streak: 18,
    level: 5,
    levelName: '公益领袖',
    badges: ['🔥', '🏆', '🌳', '💚'],
  },
  {
    id: 'user_3',
    name: '爱心使者王阿姨',
    avatar: '💝',
    totalMinutes: 720,
    totalCheckIns: 42,
    streak: 12,
    level: 4,
    levelName: '公益先锋',
    badges: ['🔥', '💖', '🏆'],
  },
  {
    id: 'user_4',
    name: '公益新星小陈',
    avatar: '✨',
    totalMinutes: 450,
    totalCheckIns: 28,
    streak: 8,
    level: 3,
    levelName: '公益达人',
    badges: ['🔥', '⭐'],
  },
  {
    id: 'user_5',
    name: '热心邻居老刘',
    avatar: '🏠',
    totalMinutes: 320,
    totalCheckIns: 21,
    streak: 5,
    level: 2,
    levelName: '公益新星',
    badges: ['🌟'],
  },
  {
    id: 'user_6',
    name: '绿色出行者小赵',
    avatar: '🚲',
    totalMinutes: 180,
    totalCheckIns: 15,
    streak: 3,
    level: 2,
    levelName: '公益新星',
    badges: ['🌱'],
  },
  {
    id: 'user_7',
    name: '公益新手小孙',
    avatar: '🌱',
    totalMinutes: 90,
    totalCheckIns: 8,
    streak: 2,
    level: 1,
    levelName: '公益新手',
    badges: [],
  },
  {
    id: 'user_current',
    name: '我',
    avatar: '😊',
    totalMinutes: 0,
    totalCheckIns: 0,
    streak: 0,
    level: 1,
    levelName: '公益新手',
    badges: [],
    isCurrentUser: true,
  },
];

export const getLeaderboardWithUser = (userStats: {
  totalMinutes: number;
  totalCheckIns: number;
  currentStreak: number;
}): LeaderboardUser[] => {
  const updated = leaderboardData.map(user => {
    if (user.isCurrentUser) {
      const level = userStats.totalMinutes >= 1500 ? 6 :
                    userStats.totalMinutes >= 1000 ? 5 :
                    userStats.totalMinutes >= 600 ? 4 :
                    userStats.totalMinutes >= 300 ? 3 :
                    userStats.totalMinutes >= 100 ? 2 : 1;
      const levelNames = ['公益新手', '公益新星', '公益达人', '公益先锋', '公益领袖', '公益大师'];
      return {
        ...user,
        totalMinutes: userStats.totalMinutes,
        totalCheckIns: userStats.totalCheckIns,
        streak: userStats.currentStreak,
        level,
        levelName: levelNames[level - 1],
      };
    }
    return user;
  });

  return updated.sort((a, b) => b.totalMinutes - a.totalMinutes);
};