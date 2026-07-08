import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Badge, SearchHistory, FavoriteRoute } from '@shared/types';
import { mockBadges, mockRoutes } from '../data/mockData';

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  badges: Badge[];
  searchHistory: SearchHistory[];
  favorites: FavoriteRoute[];
  login: (email: string, password: string) => boolean;
  register: (username: string, email: string, password: string) => boolean;
  logout: () => void;
  addSearchHistory: (from: string, to: string, date: string) => void;
  clearSearchHistory: () => void;
  toggleFavorite: (routeId: string) => void;
  isFavorite: (routeId: string) => boolean;
  addPoints: (points: number) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoggedIn: false,
      badges: mockBadges,
      searchHistory: [],
      favorites: [],

      login: (email: string, password: string) => {
        if (email && password.length >= 6) {
          const mockUser: User = {
            id: 'user-current',
            username: email.split('@')[0],
            email,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
            points: 2680,
            level: 3,
            createdAt: new Date().toISOString().split('T')[0],
          };
          set({ user: mockUser, isLoggedIn: true });
          return true;
        }
        return false;
      },

      register: (username: string, email: string, password: string) => {
        if (username && email && password.length >= 6) {
          const newUser: User = {
            id: 'user-current',
            username,
            email,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
            points: 500,
            level: 1,
            createdAt: new Date().toISOString().split('T')[0],
          };
          set({ user: newUser, isLoggedIn: true });
          return true;
        }
        return false;
      },

      logout: () => {
        set({ user: null, isLoggedIn: false });
      },

      addSearchHistory: (from: string, to: string, date: string) => {
        const history = get().searchHistory;
        const newItem: SearchHistory = {
          id: Math.random().toString(36).substr(2, 9),
          from,
          to,
          date,
          searchedAt: new Date().toISOString(),
        };
        const filtered = history.filter(
          (h) => !(h.from === from && h.to === to && h.date === date)
        );
        set({ searchHistory: [newItem, ...filtered].slice(0, 20) });
      },

      clearSearchHistory: () => {
        set({ searchHistory: [] });
      },

      toggleFavorite: (routeId: string) => {
        const { favorites } = get();
        const exists = favorites.find((f) => f.routeId === routeId);
        if (exists) {
          set({
            favorites: favorites.filter((f) => f.routeId !== routeId),
          });
        } else {
          const route = mockRoutes.find((r) => r.id === routeId);
          if (route) {
            set({
              favorites: [
                {
                  id: Math.random().toString(36).substr(2, 9),
                  routeId,
                  route,
                  addedAt: new Date().toISOString(),
                },
                ...favorites,
              ],
            });
          }
        }
      },

      isFavorite: (routeId: string) => {
        return get().favorites.some((f) => f.routeId === routeId);
      },

      addPoints: (points: number) => {
        const { user } = get();
        if (user) {
          set({
            user: {
              ...user,
              points: user.points + points,
            },
          });
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
