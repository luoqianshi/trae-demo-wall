import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CheckIn {
  id: string;
  taskId: string;
  taskName: string;
  taskIcon: string;
  duration: number;
  timestamp: number;
  category: string;
  difficulty: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
}

export interface UserStats {
  totalMinutes: number;
  weekMinutes: number;
  monthMinutes: number;
  totalCheckIns: number;
  currentStreak: number;
  longestStreak: number;
  lastCheckInDate?: string;
  environmentalTasks: number;
  donationTasks: number;
  helpTasks: number;
  spreadTasks: number;
  uniqueTaskCount: number;
  earlyMorningCheckIns: number;
}

export interface DiaryEntry {
  id: string;
  date: string;
  taskName: string;
  taskIcon: string;
  category: string;
  duration: number;
  reflection: string;
  mood: string;
  timestamp: number;
}

interface AppState {
  currentPage: 'home' | 'calendar' | 'knowledge' | 'profile' | 'ai';
  checkIns: CheckIn[];
  achievements: Achievement[];
  favorites: string[];
  completedTaskIds: string[];
  stats: UserStats;
  newAchievement: Achievement | null;
  hasCompletedOnboarding: boolean;
  diaryEntries: DiaryEntry[];
  activeChallengeId: string | null;

  setPage: (page: 'home' | 'calendar' | 'knowledge' | 'profile' | 'ai') => void;
  getLastCheckInHours: () => number;
  completeOnboarding: () => void;
  addDiaryEntry: (entry: DiaryEntry) => void;
  startChallenge: (challengeId: string) => void;
  completeChallenge: (challengeId: string) => void;
  addCheckIn: (task: {
    id: string;
    name: string;
    icon: string;
    category: string;
    duration: number;
    difficulty: string;
  }) => void;
  removeCheckIn: (id: string) => void;
  toggleFavorite: (id: string) => void;
  checkAchievements: () => void;
  clearNewAchievement: () => void;
  getLevel: () => { level: number; name: string; progress: number; nextLevel: number };
  getWeeklyData: () => { day: string; minutes: number }[];
}

const initialStats: UserStats = {
  totalMinutes: 0,
  weekMinutes: 0,
  monthMinutes: 0,
  totalCheckIns: 0,
  currentStreak: 0,
  longestStreak: 0,
  environmentalTasks: 0,
  donationTasks: 0,
  helpTasks: 0,
  spreadTasks: 0,
  uniqueTaskCount: 0,
  earlyMorningCheckIns: 0,
};

const defaultAchievements: Achievement[] = [
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
    description: '在早晨6-9点完成一次打卡，清晨的公益最暖心',
    icon: '🌅',
    unlocked: false,
  },
];

const levelNames = ['公益新手', '公益新星', '公益达人', '公益先锋', '公益领袖', '公益大师'];

const getDateString = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const calculateStreak = (checkIns: CheckIn[]): number => {
  if (checkIns.length === 0) return 0;
  const sortedDates = [...new Set(checkIns.map(c => getDateString(new Date(c.timestamp))))].sort().reverse();
  if (sortedDates.length === 0) return 0;

  const today = getDateString(new Date());
  const yesterday = getDateString(new Date(Date.now() - 86400000));

  if (sortedDates[0] !== today && sortedDates[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1]);
    const curr = new Date(sortedDates[i]);
    const diffDays = Math.floor((prev.getTime() - curr.getTime()) / 86400000);
    if (diffDays === 1) streak++;
    else break;
  }
  return streak;
};

const calculateUniqueCategories = (checkIns: CheckIn[]): number => {
  const categories = new Set(checkIns.map(c => c.category));
  return categories.size;
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentPage: 'home',
      checkIns: [],
      achievements: defaultAchievements.map(a => ({ ...a })),
      favorites: [],
      completedTaskIds: [],
      stats: initialStats,
      newAchievement: null,
      hasCompletedOnboarding: false,
      diaryEntries: [],
      activeChallengeId: null,

      setPage: (page) => set({ currentPage: page }),

      getLastCheckInHours: () => {
        const records = get().checkIns;
        if (records.length === 0) return 999;
        const last = records[records.length - 1];
        return Math.floor((Date.now() - last.timestamp) / 3600000);
      },

      completeOnboarding: () => set({ hasCompletedOnboarding: true }),

      addDiaryEntry: (entry) => set({ diaryEntries: [...get().diaryEntries, entry] }),

      startChallenge: (challengeId) => set({ activeChallengeId: challengeId }),

      completeChallenge: () => set({ activeChallengeId: null }),

      addCheckIn: (task) => {
        const now = Date.now();
        const today = getDateString(new Date());
        const yesterday = getDateString(new Date(Date.now() - 86400000));

        const newCheckIn: CheckIn = {
          id: `checkin_${now}`,
          taskId: task.id,
          taskName: task.name,
          taskIcon: task.icon,
          duration: task.duration,
          timestamp: now,
          category: task.category,
          difficulty: task.difficulty,
        };

        const existingCheckIns = get().checkIns;
        const todayCheckIns = existingCheckIns.filter(c => getDateString(new Date(c.timestamp)) === today);
        const isFirstToday = todayCheckIns.length === 0;
        const isUniqueTask = !get().completedTaskIds.includes(task.id);
        const hour = new Date(now).getHours();
        const isEarlyMorning = hour >= 6 && hour < 9;

        const prevStats = get().stats;
        const categoryCount = calculateUniqueCategories([...existingCheckIns, newCheckIn]);

        let newStreak = prevStats.currentStreak;
        if (isFirstToday) {
          if (prevStats.lastCheckInDate === yesterday) {
            newStreak = prevStats.currentStreak + 1;
          } else {
            newStreak = 1;
          }
        }

        const updatedStats: UserStats = {
          ...prevStats,
          totalMinutes: prevStats.totalMinutes + task.duration,
          weekMinutes: prevStats.weekMinutes + task.duration,
          monthMinutes: prevStats.monthMinutes + task.duration,
          totalCheckIns: prevStats.totalCheckIns + 1,
          currentStreak: newStreak,
          longestStreak: Math.max(prevStats.longestStreak, newStreak),
          lastCheckInDate: today,
          environmentalTasks: task.category === '环保' ? prevStats.environmentalTasks + 1 : prevStats.environmentalTasks,
          donationTasks: task.category === '捐赠' ? prevStats.donationTasks + 1 : prevStats.donationTasks,
          helpTasks: task.category === '帮扶' ? prevStats.helpTasks + 1 : prevStats.helpTasks,
          spreadTasks: task.category === '传播' ? prevStats.spreadTasks + 1 : prevStats.spreadTasks,
          uniqueTaskCount: Math.max(prevStats.uniqueTaskCount, categoryCount),
          earlyMorningCheckIns: isEarlyMorning ? prevStats.earlyMorningCheckIns + 1 : prevStats.earlyMorningCheckIns,
        };

        const updatedCompletedIds = isUniqueTask
          ? [...get().completedTaskIds, task.id]
          : get().completedTaskIds;

        set({
          checkIns: [...existingCheckIns, newCheckIn],
          stats: updatedStats,
          completedTaskIds: updatedCompletedIds,
        });

        get().checkAchievements();
      },

      removeCheckIn: (id) => {
        const checkIn = get().checkIns.find(c => c.id === id);
        if (!checkIn) return;

        const updatedCheckIns = get().checkIns.filter(c => c.id !== id);
        const newStreak = calculateStreak(updatedCheckIns);
        const categoryCount = calculateUniqueCategories(updatedCheckIns);

        set({
          checkIns: updatedCheckIns,
          stats: {
            ...get().stats,
            totalMinutes: get().stats.totalMinutes - checkIn.duration,
            weekMinutes: Math.max(0, get().stats.weekMinutes - checkIn.duration),
            monthMinutes: Math.max(0, get().stats.monthMinutes - checkIn.duration),
            totalCheckIns: get().stats.totalCheckIns - 1,
            currentStreak: newStreak,
            longestStreak: Math.max(get().stats.longestStreak, newStreak),
            environmentalTasks: checkIn.category === '环保' ? Math.max(0, get().stats.environmentalTasks - 1) : get().stats.environmentalTasks,
            donationTasks: checkIn.category === '捐赠' ? Math.max(0, get().stats.donationTasks - 1) : get().stats.donationTasks,
            helpTasks: checkIn.category === '帮扶' ? Math.max(0, get().stats.helpTasks - 1) : get().stats.helpTasks,
            spreadTasks: checkIn.category === '传播' ? Math.max(0, get().stats.spreadTasks - 1) : get().stats.spreadTasks,
            uniqueTaskCount: categoryCount,
          },
        });
      },

      toggleFavorite: (id) => {
        const favorites = get().favorites;
        if (favorites.includes(id)) {
          set({ favorites: favorites.filter(f => f !== id) });
        } else {
          set({ favorites: [...favorites, id] });
        }
      },

      checkAchievements: () => {
        const { stats, achievements } = get();
        const conditions = [
          stats.totalCheckIns >= 1,
          stats.currentStreak >= 3 || stats.longestStreak >= 3,
          stats.totalCheckIns >= 7,
          stats.totalCheckIns >= 15,
          stats.totalCheckIns >= 30,
          stats.environmentalTasks >= 10,
          stats.environmentalTasks >= 20,
          stats.helpTasks >= 10,
          stats.totalMinutes >= 600,
          stats.totalMinutes >= 1800,
          stats.totalMinutes >= 3600,
          stats.spreadTasks >= 10,
          stats.donationTasks >= 5,
          stats.uniqueTaskCount >= 5,
          stats.currentStreak >= 7 || stats.longestStreak >= 7,
          stats.currentStreak >= 14 || stats.longestStreak >= 14,
          stats.totalCheckIns >= 100,
          stats.earlyMorningCheckIns >= 1,
        ];

        let newUnlocked: Achievement | null = null;
        const updatedAchievements = achievements.map((ach, index) => {
          if (!ach.unlocked && conditions[index]) {
            const newAch = { ...ach, unlocked: true, unlockedAt: Date.now() };
            newUnlocked = newAch;
            return newAch;
          }
          return ach;
        });

        if (newUnlocked) {
          set({ achievements: updatedAchievements, newAchievement: newUnlocked });
        }
      },

      clearNewAchievement: () => set({ newAchievement: null }),

      getLevel: () => {
        const minutes = get().stats.totalMinutes;
        const thresholds = [0, 100, 300, 600, 1000, 1500];
        let level = 0;
        for (let i = thresholds.length - 1; i >= 0; i--) {
          if (minutes >= thresholds[i]) {
            level = i;
            break;
          }
        }
        const currentThreshold = thresholds[level] || 0;
        const nextThreshold = thresholds[level + 1] || 1500;
        const progress = Math.min(100, ((minutes - currentThreshold) / (nextThreshold - currentThreshold)) * 100);
        return {
          level: level + 1,
          name: levelNames[level] || '公益大师',
          progress,
          nextLevel: nextThreshold,
        };
      },

      getWeeklyData: () => {
        const checkIns = get().checkIns;
        const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        const weekData: { day: string; minutes: number }[] = [];

        for (let i = 6; i >= 0; i--) {
          const date = new Date(Date.now() - i * 86400000);
          const dateStr = getDateString(date);
          const dayMinutes = checkIns
            .filter(c => getDateString(new Date(c.timestamp)) === dateStr)
            .reduce((sum, c) => sum + c.duration, 0);

          weekData.push({ day: days[date.getDay()], minutes: dayMinutes });
        }
        return weekData;
      },
    }),
    {
      name: 'volunteer-mate-storage',
      partialize: (state) => ({
        checkIns: state.checkIns,
        achievements: state.achievements,
        favorites: state.favorites,
        stats: state.stats,
        completedTaskIds: state.completedTaskIds,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        diaryEntries: state.diaryEntries,
        activeChallengeId: state.activeChallengeId,
      }),
    }
  )
);
