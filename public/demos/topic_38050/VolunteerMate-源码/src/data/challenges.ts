export interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  days: number;
  reward: number;
  badge: string;
  badgeIcon: string;
  startDate?: number;
  progress?: number;
  completed?: boolean;
}

export const challenges: Challenge[] = [
  {
    id: 'challenge_1',
    title: '7日连续打卡挑战',
    description: '连续7天完成公益打卡，养成公益习惯',
    icon: '🔥',
    days: 7,
    reward: 100,
    badge: '坚持之星',
    badgeIcon: '⭐',
  },
  {
    id: 'challenge_2',
    title: '环保达人挑战',
    description: '一周内完成5次环保类任务',
    icon: '🌿',
    days: 7,
    reward: 80,
    badge: '环保先锋',
    badgeIcon: '🌳',
  },
  {
    id: 'challenge_3',
    title: '爱心传递挑战',
    description: '一周内完成3次帮扶类任务',
    icon: '💝',
    days: 7,
    reward: 90,
    badge: '爱心使者',
    badgeIcon: '💖',
  },
  {
    id: 'challenge_4',
    title: '公益新星挑战',
    description: '累计公益时长达到60分钟',
    icon: '✨',
    days: 7,
    reward: 60,
    badge: '公益新星',
    badgeIcon: '🌟',
  },
  {
    id: 'challenge_5',
    title: '全能公益人挑战',
    description: '完成4种不同类型的公益任务',
    icon: '🌈',
    days: 7,
    reward: 120,
    badge: '多元化公益',
    badgeIcon: '🏅',
  },
];

export const getActiveChallenge = (challenges: Challenge[]): Challenge | null => {
  return challenges.find(c => c.startDate && !c.completed) || null;
};

export const startChallenge = (challenge: Challenge): Challenge => {
  return {
    ...challenge,
    startDate: Date.now(),
    progress: 0,
    completed: false,
  };
};