import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Partner, FlashCard, PomodoroSession, AppState } from '@/types';

const generateId = () => Math.random().toString(36).substring(2, 11);

const defaultPartner: Partner = {
  id: 'default',
  name: '小伴',
  personality: 'gentle',
  nickname: '同学',
  avatarUrl: '',
};

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      partner: null,
      cards: [],
      pomodoroSessions: [],
      currentPomodoroDuration: 25,
      notificationEnabled: false,
      
      setPartner: (partner) => set({ partner }),
      
      updatePartner: (updates) =>
        set((state) => ({
          partner: state.partner ? { ...state.partner, ...updates } : null,
        })),
      
      addCard: (card) =>
        set((state) => ({ cards: [...state.cards, card] })),
      
      addCards: (cards) =>
        set((state) => ({ cards: [...state.cards, ...cards] })),
      
      toggleMastered: (id) =>
        set((state) => ({
          cards: state.cards.map((card) =>
            card.id === id ? { ...card, mastered: !card.mastered } : card
          ),
        })),
      
      clearCards: () => set({ cards: [] }),
      
      addPomodoroSession: (session) =>
        set((state) => ({ pomodoroSessions: [...state.pomodoroSessions, session] })),
      
      updatePomodoroSession: (id, updates) =>
        set((state) => ({
          pomodoroSessions: state.pomodoroSessions.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        })),
      
      setPomodoroDuration: (duration) => set({ currentPomodoroDuration: duration }),
      
      toggleNotifications: () =>
        set((state) => ({ notificationEnabled: !state.notificationEnabled })),
    }),
    {
      name: 'ai-study-companion',
    }
  )
);
