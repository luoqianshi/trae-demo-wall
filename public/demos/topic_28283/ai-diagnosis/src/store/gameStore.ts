import { create } from 'zustand';
import { GAME_STATE } from '@/engine/Constants';

interface GameStore {
  gameState: string;
  score: number;
  coins: number;
  lives: number;
  time: number;
  level: string;
  soundEnabled: boolean;
  musicEnabled: boolean;
  setGameState: (state: string) => void;
  setHUD: (score: number, coins: number, lives: number, time: number, level: string) => void;
  toggleSound: () => void;
  toggleMusic: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  gameState: GAME_STATE.MENU,
  score: 0,
  coins: 0,
  lives: 3,
  time: 400,
  level: '1-1',
  soundEnabled: true,
  musicEnabled: true,
  setGameState: (gameState) => set({ gameState }),
  setHUD: (score, coins, lives, time, level) => set({ score, coins, lives, time, level }),
  toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
  toggleMusic: () => set((s) => ({ musicEnabled: !s.musicEnabled })),
}));
