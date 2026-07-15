import { create } from 'zustand';
import type { GameStatus } from '@/types/game';
import { INITIAL_LIVES } from '@/types/game';

const HIGH_SCORE_KEY = 'starbreakout_highscore';

interface GameState {
  status: GameStatus;
  score: number;
  highScore: number;
  lives: number;
  level: number;

  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  addScore: (points: number) => void;
  loseLife: () => boolean;
  goToNextLevel: () => void;
  setLevelUp: () => void;
  endGame: (won: boolean) => void;
  resetGame: () => void;
  loadHighScore: () => void;
}

const loadStoredHighScore = (): number => {
  try {
    const stored = localStorage.getItem(HIGH_SCORE_KEY);
    return stored ? parseInt(stored, 10) : 0;
  } catch {
    return 0;
  }
};

const saveHighScore = (score: number) => {
  try {
    localStorage.setItem(HIGH_SCORE_KEY, String(score));
  } catch {
    /* noop */
  }
};

export const useGameStore = create<GameState>((set, get) => ({
  status: 'menu',
  score: 0,
  highScore: loadStoredHighScore(),
  lives: INITIAL_LIVES,
  level: 1,

  startGame: () =>
    set({
      status: 'playing',
      score: 0,
      lives: INITIAL_LIVES,
      level: 1,
    }),

  pauseGame: () => {
    if (get().status === 'playing') set({ status: 'paused' });
  },

  resumeGame: () => {
    if (get().status === 'paused') set({ status: 'playing' });
  },

  addScore: (points) => {
    const newScore = get().score + points;
    const currentHigh = get().highScore;
    const newHigh = Math.max(currentHigh, newScore);
    if (newHigh > currentHigh) saveHighScore(newHigh);
    set({ score: newScore, highScore: newHigh });
  },

  loseLife: () => {
    const remaining = get().lives - 1;
    if (remaining <= 0) {
      set({ lives: 0, status: 'lost' });
      return false;
    }
    set({ lives: remaining });
    return true;
  },

  goToNextLevel: () => {
    set((state) => ({ level: state.level + 1, status: 'playing' }));
  },

  setLevelUp: () => set({ status: 'levelUp' }),

  endGame: (won) => set({ status: won ? 'won' : 'lost' }),

  resetGame: () =>
    set({
      status: 'menu',
      score: 0,
      lives: INITIAL_LIVES,
      level: 1,
    }),

  loadHighScore: () => set({ highScore: loadStoredHighScore() }),
}));
