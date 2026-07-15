import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PlayerProgress, Achievement } from '@/types';
import { getInitialUnlockedHeroes } from '@/data/heroes';

const initialProgress: PlayerProgress = {
  highScore: 0,
  currentLevel: 1,
  unlockedHeroes: getInitialUnlockedHeroes(),
  totalWordsLearned: 0,
  accuracyRate: 0,
  playTimeMinutes: 0,
  wordMastery: {},
  achievements: [],
};

export const achievementsList: Achievement[] = [
  { id: 'a1', name: '初学者', description: '完成第一次游戏', icon: '🌟', unlocked: false },
  { id: 'a2', name: '单词达人', description: '累计学习50个单词', icon: '📚', unlocked: false },
  { id: 'a3', name: '拼写大师', description: '准确率达到90%', icon: '🏆', unlocked: false },
  { id: 'a4', name: '波次英雄', description: '通过第10波', icon: '⚔️', unlocked: false },
  { id: 'a5', name: '百万富翁', description: '累计获得1000分', icon: '💰', unlocked: false },
  { id: 'a6', name: '全英雄解锁', description: '解锁所有英雄', icon: '👑', unlocked: false },
];

interface ProgressStore {
  progress: PlayerProgress;
  achievements: Achievement[];
  updateScore: (score: number) => void;
  updateLevel: (level: number) => void;
  unlockHero: (heroId: string) => void;
  updateWordMastery: (wordId: string, mastery: number) => void;
  updateAccuracy: (correct: number, total: number) => void;
  addPlayTime: (minutes: number) => void;
  incrementWordsLearned: () => void;
  checkAchievements: () => void;
  resetProgress: () => void;
}

export const useProgressStore = create<ProgressStore>()(
  persist(
    (set, get) => ({
      progress: initialProgress,
      achievements: achievementsList,
      updateScore: (score) => {
        set((state) => {
          const newHighScore = Math.max(state.progress.highScore, score);
          return {
            progress: { ...state.progress, highScore: newHighScore },
          };
        });
        get().checkAchievements();
      },
      updateLevel: (level) => {
        set((state) => ({
          progress: { ...state.progress, currentLevel: Math.max(state.progress.currentLevel, level) },
        }));
        get().checkAchievements();
      },
      unlockHero: (heroId) => {
        set((state) => {
          if (!state.progress.unlockedHeroes.includes(heroId)) {
            return {
              progress: {
                ...state.progress,
                unlockedHeroes: [...state.progress.unlockedHeroes, heroId],
              },
            };
          }
          return state;
        });
        get().checkAchievements();
      },
      updateWordMastery: (wordId, mastery) => {
        set((state) => ({
          progress: {
            ...state.progress,
            wordMastery: { ...state.progress.wordMastery, [wordId]: mastery },
          },
        }));
      },
      updateAccuracy: (correct, total) => {
        if (total === 0) return;
        set((state) => {
          const newAccuracy = (correct / total) * 100;
          return {
            progress: { ...state.progress, accuracyRate: newAccuracy },
          };
        });
        get().checkAchievements();
      },
      addPlayTime: (minutes) => {
        set((state) => ({
          progress: { ...state.progress, playTimeMinutes: state.progress.playTimeMinutes + minutes },
        }));
      },
      incrementWordsLearned: () => {
        set((state) => ({
          progress: { ...state.progress, totalWordsLearned: state.progress.totalWordsLearned + 1 },
        }));
        get().checkAchievements();
      },
      checkAchievements: () => {
        const { progress } = get();
        const newAchievements = achievementsList.map((achievement) => {
          if (achievement.unlocked) return achievement;
          
          let unlocked = false;
          switch (achievement.id) {
            case 'a1':
              unlocked = progress.totalWordsLearned > 0;
              break;
            case 'a2':
              unlocked = progress.totalWordsLearned >= 50;
              break;
            case 'a3':
              unlocked = progress.accuracyRate >= 90;
              break;
            case 'a4':
              unlocked = progress.currentLevel >= 10;
              break;
            case 'a5':
              unlocked = progress.highScore >= 1000;
              break;
            case 'a6':
              unlocked = progress.unlockedHeroes.length >= 6;
              break;
          }
          return { ...achievement, unlocked };
        });
        
        set({ achievements: newAchievements });
      },
      resetProgress: () => {
        set({ progress: initialProgress, achievements: achievementsList });
      },
    }),
    {
      name: 'spelling-defense-progress',
    }
  )
);
