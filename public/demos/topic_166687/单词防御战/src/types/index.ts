export interface Word {
  id: string;
  word: string;
  meaning: string;
  partOfSpeech: 'noun' | 'verb' | 'adjective' | 'adverb' | 'preposition' | 'conjunction';
  difficulty: 1 | 2 | 3 | 4 | 5;
  mastery: 0 | 1 | 2 | 3 | 4 | 5;
}

export interface Hero {
  id: string;
  name: string;
  emoji: string;
  skill: string;
  damage: number;
  range: number;
  cost: number;
  element: 'fire' | 'water' | 'earth' | 'wind' | 'light' | 'dark';
  color: string;
  description: string;
}

export interface PlayerProgress {
  highScore: number;
  currentLevel: number;
  unlockedHeroes: string[];
  totalWordsLearned: number;
  accuracyRate: number;
  playTimeMinutes: number;
  wordMastery: Record<string, number>;
  achievements: string[];
}

export interface HeroPlacement {
  id: string;
  heroId: string;
  x: number;
  y: number;
}

export interface Enemy {
  id: string;
  health: number;
  maxHealth: number;
  speed: number;
  x: number;
  y: number;
  reward: number;
  type: 'normal' | 'fast' | 'tank' | 'boss';
}

export interface GameState {
  wave: number;
  score: number;
  lives: number;
  heroPositions: HeroPlacement[];
  activeWords: string[];
  enemies: Enemy[];
  currentWord: Word | null;
  isGameOver: boolean;
  isVictory: boolean;
  selectedHero: string | null;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

export type Difficulty = 1 | 2 | 3 | 4 | 5;
