import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Checkin } from '@/types';

interface AppState {
  user: User;
  checkins: Checkin[];
  addCheckin: (tennisCount: number, imageUrl: string) => void;
  redeemGift: (points: number) => void;
  updateUser: (user: Partial<User>) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      user: {
        id: 'user-1',
        name: '网球爱好者',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
        points: 2580,
        totalTennis: 129,
        badges: ['beginner', 'eco-warrior', 'weekly-champion'],
        joinDate: '2026-01-15',
      },
      checkins: [],
      addCheckin: (tennisCount, imageUrl) => {
        const pointsEarned = tennisCount * 20;
        const now = new Date().toISOString().split('T')[0];
        set((state) => ({
          user: {
            ...state.user,
            points: state.user.points + pointsEarned,
            totalTennis: state.user.totalTennis + tennisCount,
          },
          checkins: [
            {
              id: `c-${Date.now()}`,
              userId: state.user.id,
              imageUrl,
              tennisCount,
              pointsEarned,
              createdAt: now,
            },
            ...state.checkins,
          ],
        }));
      },
      redeemGift: (points) => {
        set((state) => ({
          user: {
            ...state.user,
            points: Math.max(0, state.user.points - points),
          },
        }));
      },
      updateUser: (updates) => {
        set((state) => ({
          user: { ...state.user, ...updates },
        }));
      },
    }),
    {
      name: 'viveball-storage',
    }
  )
);
