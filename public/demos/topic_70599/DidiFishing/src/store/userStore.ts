// 用户全局状态（Zustand）
import { create } from 'zustand';
import type { User, UserStats } from '../types/user';
import { getCurrentUser } from '../services/api';

interface UserState {
  currentUser: User | null;
  stats: UserStats;
  logged: boolean;
  fetchUser: () => Promise<void>;
  setUser: (user: User) => void;
  reset: () => void;
}

const defaultStats: UserStats = {
  publishedOrders: 8,
  matchedOrders: 5,
  ongoingOrders: 1,
  completedOrders: 23,
  articles: 12
};

export const useUserStore = create<UserState>((set) => ({
  currentUser: null,
  stats: defaultStats,
  logged: false,
  fetchUser: async () => {
    try {
      const res = await getCurrentUser();
      set({ currentUser: res.data.user, logged: true });
    } catch (err) {
      console.error('[UserStore] fetchUser failed:', err);
    }
  },
  setUser: (user) => set({ currentUser: user, logged: true }),
  reset: () => set({ currentUser: null, logged: false })
}));
