export type OperationType = 'add' | 'sub' | 'mul' | 'div' | 'mixed';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Question {
  id: number;
  num1: number;
  num2: number;
  operator: '+' | '-' | '×' | '÷';
  answer: number;
  userAnswer?: number;
  isCorrect?: boolean;
}

export interface GameConfig {
  operationType: OperationType;
  difficulty: Difficulty;
  questionCount: number;
}

export interface GameState {
  config: GameConfig;
  questions: Question[];
  currentIndex: number;
  score: number;
  correctCount: number;
  timeUsed: number;
  isPlaying: boolean;
  streak: number;
}

export interface GameHistory {
  id: string;
  date: string;
  operationType: OperationType;
  difficulty: Difficulty;
  score: number;
  accuracy: number;
  timeUsed: number;
  questionCount: number;
}

export const DIFFICULTY_RANGE: Record<Difficulty, { min: number; max: number }> = {
  easy: { min: 1, max: 20 },
  medium: { min: 1, max: 50 },
  hard: { min: 1, max: 100 },
};

export const OPERATION_LABELS: Record<OperationType, string> = {
  add: '加法',
  sub: '减法',
  mul: '乘法',
  div: '除法',
  mixed: '混合运算',
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
};